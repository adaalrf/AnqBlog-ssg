import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';

const execFileAsync = promisify(execFile);
const rootDirectory = process.cwd();
const publicDirectory = path.join(rootDirectory, 'public');
const buildScriptPath = path.join(process.cwd(), 'dist', 'core', 'cli', 'build.js');
const nodeExecPath = process.execPath;
const siteUrl = 'https://example.com';

const runBuildCli = async (
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> => {
  try {
    const { stdout, stderr } = await execFileAsync(nodeExecPath, [buildScriptPath, ...args], {
      cwd: rootDirectory,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: 'test' },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      code: typeof err.code === 'number' ? err.code : 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
};

const isFile = async (filePath: string): Promise<boolean> => {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
};

const collectFiles = async (directory: string, extension?: string): Promise<string[]> => {
  const files: string[] = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath, extension)));
    } else if (entry.isFile() && (!extension || entry.name.endsWith(extension))) {
      files.push(entryPath);
    }
  }

  return files;
};

const outputPathForUrl = async (pathname: string): Promise<string | null> => {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, '');
  const candidates =
    decodedPath === '/' || relativePath === ''
      ? [path.join(publicDirectory, 'index.html')]
      : decodedPath.endsWith('/')
        ? [path.join(publicDirectory, relativePath, 'index.html')]
        : [
            path.join(publicDirectory, relativePath),
            path.join(publicDirectory, relativePath, 'index.html'),
          ];

  for (const candidate of candidates) {
    if (await isFile(candidate)) {
      return candidate;
    }
  }

  return null;
};

const findBrokenInternalReferences = async (): Promise<string[]> => {
  const htmlFiles = await collectFiles(publicDirectory, '.html');
  const brokenReferences: string[] = [];

  for (const htmlFile of htmlFiles) {
    const html = await fs.readFile(htmlFile, 'utf8');
    const pagePath = path.relative(publicDirectory, htmlFile).split(path.sep).join('/');
    const pageUrl =
      pagePath === 'index.html'
        ? `${siteUrl}/`
        : `${siteUrl}/${pagePath.replace(/index\.html$/, '')}`;
    const document = new JSDOM(html, { url: pageUrl }).window.document;

    for (const element of document.querySelectorAll<HTMLElement>(
      'a[href], link[href], script[src], img[src]',
    )) {
      if (element.closest('code, pre')) {
        continue;
      }

      const attribute = element.hasAttribute('href') ? 'href' : 'src';
      const reference = element.getAttribute(attribute)?.trim();
      if (
        !reference ||
        reference.startsWith('#') ||
        /^(?:data|mailto|tel|javascript):/i.test(reference)
      ) {
        continue;
      }

      const targetUrl = new URL(reference, pageUrl);
      if (targetUrl.origin !== siteUrl) {
        continue;
      }

      if (!(await outputPathForUrl(targetUrl.pathname))) {
        brokenReferences.push(`${pagePath}: ${attribute}="${reference}"`);
      }
    }
  }

  return brokenReferences;
};

test('build cli: rejects unsupported flags', { timeout: 120_000 }, async () => {
  const result = await runBuildCli(['--dry-run']);
  assert.equal(result.code, 1);
});

test('build cli: succeeds with no flags', { timeout: 180_000 }, async () => {
  const result = await runBuildCli([]);
  assert.equal(result.code, 0, result.stderr || result.stdout);

  const requiredOutputs = [
    'index.html',
    '404.html',
    'blog/index.html',
    'blog/tags/index.html',
    'rss.xml',
    'sitemap.xml',
    'styles/styles.css',
    'js/bundle.js',
  ];
  for (const output of requiredOutputs) {
    assert.equal(await isFile(path.join(publicDirectory, output)), true, `missing ${output}`);
  }

  const postOutputs = await collectFiles(path.join(publicDirectory, 'blog', 'posts'), '.html');
  assert.ok(postOutputs.length > 0, 'expected at least one generated blog post');

  const tagOutputs = await collectFiles(path.join(publicDirectory, 'blog', 'tags'), '.html');
  assert.ok(
    tagOutputs.some((tagPath) => path.basename(tagPath) !== 'index.html'),
    'expected at least one generated blog tag page',
  );

  const homepage = new JSDOM(await fs.readFile(path.join(publicDirectory, 'index.html'), 'utf8'))
    .window.document;
  assert.equal(homepage.querySelector('link[rel="canonical"]')?.getAttribute('href'), siteUrl);
  assert.equal(homepage.querySelector('meta[property="og:url"]')?.getAttribute('content'), siteUrl);
  assert.equal(await isFile(path.join(publicDirectory, 'pages', 'index.html')), false);

  const notFoundPage = new JSDOM(await fs.readFile(path.join(publicDirectory, '404.html'), 'utf8'))
    .window.document;
  assert.equal(
    notFoundPage.querySelector('meta[name="robots"]')?.getAttribute('content'),
    'noindex, follow',
  );

  const brokenReferences = await findBrokenInternalReferences();
  assert.deepEqual(
    brokenReferences,
    [],
    `broken generated references:\n${brokenReferences.join('\n')}`,
  );
});
