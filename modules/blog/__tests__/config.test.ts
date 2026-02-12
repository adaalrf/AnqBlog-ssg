import path from 'path';
import assert from 'node:assert';
import { test } from 'node:test';
import type { Config } from '../../../core/types/config.js';
import { getBlogConfig, getBlogDirectoryPairs, validateBlogConfig } from '../config.js';

const rootPath = (relativePath: string): string => path.join(process.cwd(), relativePath);

const createBaseConfig = (): Config => ({
  siteName: 'Test Site',
  siteDescription: 'Test Description',
  siteUrl: 'https://example.com',
  githubUrl: 'https://github.com/example',
  authorName: 'example',
  copyrightYear: 2026,
  dateLocale: 'en-US',
  siteLanguage: 'en',
  inputCSS: rootPath('styles/tailwind.css'),
  outputCSS: rootPath('public/styles/styles.css'),
  contentDirectory: rootPath('content'),
  template404Path: rootPath('templates/404-template.html'),
  mainLayoutPath: rootPath('templates/layout-template.html'),
  publicContentOutputDirectory: rootPath('public'),
  themes: ['dark', 'light'],
  defaultTheme: 'dark',
  modules: ['blog'],
  postsPerPage: 5,
  previewLength: 200,
  titleTruncationLength: 25,
  titleTruncationLengthBreadcrumb: 20,
  paginationWindowSize: 5,
  maxMarkdownFileSize: 5 * 1024 * 1024,
  postsContentDirectory: rootPath('content/blog/posts'),
  templatePostsPath: rootPath('templates/post-template.html'),
  templateBlogPath: rootPath('templates/listing-template.html'),
  templateMainTagsPath: rootPath('templates/main-tags-template.html'),
  tempPostsOutputDirectory: rootPath('.build/blog/posts'),
  tempTagsOutputDirectory: rootPath('.build/blog/tags'),
  tempBlogOutputPath: rootPath('.build/blog'),
  publicBlogOutputPath: rootPath('public/blog'),
  publicPostsOutputDirectory: rootPath('public/blog/posts'),
  publicTagsOutputDirectory: rootPath('public/blog/tags'),
});

test('validateBlogConfig: accepts a valid blog config', () => {
  const config = createBaseConfig();
  assert.doesNotThrow(() => validateBlogConfig(config));
});

test('getBlogConfig: throws when required key is missing', () => {
  const config = createBaseConfig();
  delete (config as Record<string, unknown>).templateBlogPath;
  assert.throws(() => getBlogConfig(config), /missing or invalid config key: templateBlogPath/);
});

test('getBlogConfig: throws when integer key is invalid', () => {
  const config = createBaseConfig();
  (config as Record<string, unknown>).postsPerPage = 0;
  assert.throws(() => getBlogConfig(config), /config key must be >= 1: postsPerPage -> 0/);
});

test('getBlogDirectoryPairs: maps configured temp/public blog directories', () => {
  const config = createBaseConfig();
  const pairs = getBlogDirectoryPairs(config);
  assert.strictEqual(pairs.length, 3);
  assert.deepStrictEqual(pairs[0], {
    inputDir: rootPath('.build/blog/posts'),
    outputDir: rootPath('public/blog/posts'),
  });
});
