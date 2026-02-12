import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { createModuleManager } from '../module-runner.js';
import type { Config } from '../../types/config.js';
import type { ModuleContext } from '../../types/module.js';

const createConfig = (modules: string[]): Config => ({
  siteName: 'Test Site',
  siteDescription: 'Test Description',
  siteUrl: 'https://example.com',
  githubUrl: 'https://github.com/example',
  authorName: 'Example',
  copyrightYear: 2026,
  dateLocale: 'en-US',
  siteLanguage: 'en',
  themes: ['light'],
  defaultTheme: 'light',
  inputCSS: 'styles/tailwind.css',
  outputCSS: 'public/styles/styles.css',
  contentDirectory: 'content',
  template404Path: 'templates/404-template.html',
  mainLayoutPath: 'templates/layout-template.html',
  publicContentOutputDirectory: 'public',
  modules,
});

const createContext = (
  config: Config,
): { context: ModuleContext; slots: Record<string, string> } => {
  const slots: Record<string, string> = {};
  const context: ModuleContext = {
    config,
    ui: {
      setSlot: (slot: string, content: string): void => {
        slots[slot] = content;
      },
      appendSlot: (slot: string, content: string): void => {
        slots[slot] = `${slots[slot] ?? ''}${content}`;
      },
    },
  };

  return { context, slots };
};

const withFixtureModule = async (
  source: string,
  callback: (moduleName: string) => Promise<void>,
): Promise<void> => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const moduleName = `module-runner-fixture-${suffix}`;
  const distModuleDir = path.join(process.cwd(), 'dist', 'modules', moduleName);

  await fs.mkdir(distModuleDir, { recursive: true });
  await fs.writeFile(path.join(distModuleDir, 'module.js'), source, 'utf8');

  try {
    await callback(moduleName);
  } finally {
    await fs.rm(distModuleDir, { recursive: true, force: true });
  }
};

test('module-runner: executes hooks in order and returns deduplicated output manifest', async () => {
  await withFixtureModule(
    `
      export default {
        beforeRun(context) {
          context.ui.appendSlot('order', 'before>');
        },
        run(context) {
          context.ui.appendSlot('order', 'run>');
          return {
            generatedPaths: ['public/a.html', 'public/a.html', 'public/b.html']
          };
        },
        afterRun(context) {
          context.ui.appendSlot('order', 'after>');
        }
      };
    `,
    async (moduleName) => {
      const config = createConfig([moduleName]);
      const manager = await createModuleManager(config);
      const { context, slots } = createContext(config);

      const results = await manager.runModules(context);

      assert.equal(slots.order, 'before>run>after>');
      assert.equal(results.length, 1);
      assert.equal(results[0]?.moduleName, moduleName);
      assert.deepEqual(results[0]?.outputManifest, {
        generatedPaths: ['public/a.html', 'public/b.html'],
      });
    },
  );
});

test('module-runner: wraps module validation errors with module context', async () => {
  await withFixtureModule(
    `
      export default {
        validate() {
          throw new Error('invalid module config');
        },
        run() {}
      };
    `,
    async (moduleName) => {
      const config = createConfig([moduleName]);
      await assert.rejects(
        async () => createModuleManager(config),
        /Module ".*" validation failed: invalid module config/,
      );
    },
  );
});

test('module-runner: wraps hook errors with step name', async () => {
  await withFixtureModule(
    `
      export default {
        beforeRun() {
          throw new Error('hook boom');
        },
        run() {}
      };
    `,
    async (moduleName) => {
      const config = createConfig([moduleName]);
      const manager = await createModuleManager(config);
      const { context } = createContext(config);

      await assert.rejects(
        async () => manager.runModules(context),
        new RegExp(`Module "${moduleName}" beforeRun failed: hook boom`),
      );
    },
  );
});

test('module-runner: rejects invalid output manifests', async () => {
  await withFixtureModule(
    `
      export default {
        run() {
          return { generatedPaths: ['public/ok.html', ''] };
        }
      };
    `,
    async (moduleName) => {
      const config = createConfig([moduleName]);
      const manager = await createModuleManager(config);
      const { context } = createContext(config);

      await assert.rejects(
        async () => manager.runModules(context),
        new RegExp(`Module "${moduleName}" output manifest must contain non-empty strings`),
      );
    },
  );
});
