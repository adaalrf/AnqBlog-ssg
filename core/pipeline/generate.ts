import path from 'path';
import config from '../config/config.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import { createModuleManager } from './module-runner.js';
import {
  ensureDirectoryExists,
  readFileContent,
  writeFileContent,
} from '../shared/path-and-file-utils.js';
import { parseHtmlFrontMatter, replacePlaceholders } from '../internal/content-utils.js';
import { generateRobotsTxt } from './generate-robots.js';
import { formatError } from '../internal/error-utils.js';
import { buildDocumentTitle, buildLayoutPlaceholders } from '../internal/layout-placeholders.js';
import { logger } from '../shared/logger.js';
import { minifyHtml } from '../internal/html-minify.js';
import type { ModuleContext } from '../types/module.js';
import type { LayoutDirectoryPair } from '../types/layout.js';
import type { ModuleRunResult } from './module-runner.js';

const getLayoutDirectoryPairs = (
  modulePairs: LayoutDirectoryPair[] = [],
): LayoutDirectoryPair[] => [
  {
    inputDir: config.contentDirectory,
    outputDir: config.publicContentOutputDirectory,
  },
  ...modulePairs,
];

const ensureDirectories = (modulePairs: LayoutDirectoryPair[] = []): void => {
  getLayoutDirectoryPairs(modulePairs).forEach(({ inputDir, outputDir }) => {
    ensureDirectoryExists(inputDir);
    ensureDirectoryExists(outputDir);
  });
};

/**
 * Generates the entire site by combining core outputs with optional modules.
 */
const generateAllHtmlFiles = async (): Promise<void> => {
  const moduleManager = await createModuleManager(config);
  ensureDirectories(moduleManager.layoutDirectoryPairs);
  const layoutData: Record<string, string> = {};

  const context: ModuleContext = {
    config,
    ui: {
      setSlot: (slot: string, content: string): void => {
        layoutData[slot] = content;
      },
      appendSlot: (slot: string, content: string): void => {
        layoutData[slot] = `${layoutData[slot] || ''}${content}`;
      },
    },
  };

  const moduleRunResults = await moduleManager.runModules(context);
  logModuleOutputManifests(moduleRunResults);

  const layoutDirectoryPairs = getLayoutDirectoryPairs(moduleManager.layoutDirectoryPairs);
  await applyLayoutToHtmlFiles(layoutDirectoryPairs, layoutData);

  await generateCoreOutputs(context, layoutData);
};

const logModuleOutputManifests = (moduleRunResults: ModuleRunResult[]): void => {
  for (const result of moduleRunResults) {
    const outputCount = result.outputManifest?.generatedPaths.length ?? 0;
    if (outputCount === 0) {
      continue;
    }

    logger.info(
      'generate.ts',
      `Module "${result.moduleName}" reported ${outputCount} generated output path${outputCount === 1 ? '' : 's'}`,
    );
  }
};

const generateCoreOutputs = async (
  context: ModuleContext,
  layoutData: Record<string, string>,
): Promise<void> => {
  const { config } = context;

  const robotsPath = path.join(config.publicContentOutputDirectory, 'robots.txt');
  const robotsContent = generateRobotsTxt();
  await writeFileContent(robotsPath, robotsContent);
  logger.info('generate.ts', 'Generated robots.txt');

  const success404 = await generate404Page(layoutData);
  if (success404) {
    logger.info('generate.ts', 'Generated 404 page');
  }
};

const generate404Page = async (layoutData: Record<string, string>): Promise<boolean> => {
  const template404Path = config.template404Path;
  const output404Path = path.join(config.publicContentOutputDirectory, '404.html');

  try {
    const template404Content = await readFileContent(template404Path);
    const { content } = parseHtmlFrontMatter(template404Content);
    const mainLayoutContent = await readFileContent(config.mainLayoutPath);

    const finalTitle = buildDocumentTitle(config.siteName, 'Page Not Found');
    const canonicalUrl = `${config.siteUrl}/404.html`;
    const ogUrl = canonicalUrl;

    const placeholders = buildLayoutPlaceholders({
      config,
      layoutData,
      title: finalTitle,
      page: '<a href="/">Home</a> / <span>404</span>',
      children: content,
      canonicalUrl,
      ogUrl,
      ogType: 'website',
    });
    let finalHtml = replacePlaceholders(mainLayoutContent, placeholders);

    finalHtml = minifyHtml(finalHtml);
    await writeFileContent(output404Path, finalHtml);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn(
      'generate.ts',
      `Failed to generate 404 page: ${err.message}. Continuing without 404 page.`,
    );
    return false;
  }
};

generateAllHtmlFiles().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('generate.ts', formatError(err, 'Error generating HTML files'));
  process.exit(1);
});
