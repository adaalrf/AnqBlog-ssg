import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Config } from '../../types/config.js';
import { buildLayoutPlaceholders } from '../layout-placeholders.js';

const createConfig = (): Config => ({
  siteName: 'Site',
  siteDescription: 'Description',
  siteUrl: 'https://example.com',
  githubUrl: 'https://github.com/example',
  authorName: 'Author',
  copyrightYear: 2026,
  dateLocale: 'en-US',
  siteLanguage: 'en',
  themes: ['light', 'dark'],
  defaultTheme: 'light',
  inputCSS: 'styles/tailwind.css',
  outputCSS: 'public/styles/styles.css',
  contentDirectory: 'content',
  template404Path: 'templates/404-template.html',
  mainLayoutPath: 'templates/layout-template.html',
  publicContentOutputDirectory: 'public',
  modules: [],
});

test('buildLayoutPlaceholders: builds stable shared placeholder payload', () => {
  const placeholders = buildLayoutPlaceholders({
    config: createConfig(),
    data: {
      custom: 'from-data',
      title: 'data-title',
    },
    layoutData: {
      custom: 'from-layout',
      tagsDropdown: '<li>tag</li>',
    },
    title: 'final-title',
    page: '/ page',
    children: '<main/>',
    canonicalUrl: 'https://example.com/page',
  });

  assert.equal(placeholders.custom, 'from-layout');
  assert.equal(placeholders.title, 'final-title');
  assert.equal(placeholders.page, '/ page');
  assert.equal(placeholders.children, '<main/>');
  assert.equal(placeholders.siteName, 'Site');
  assert.equal(placeholders.themesList, 'light dark');
  assert.equal(placeholders.defaultTheme, 'light');
  assert.equal(placeholders.canonicalUrl, 'https://example.com/page');
  assert.equal(placeholders.ogUrl, 'https://example.com/page');
  assert.equal(placeholders.ogType, 'website');
});

test('buildLayoutPlaceholders: accepts explicit og overrides', () => {
  const placeholders = buildLayoutPlaceholders({
    config: createConfig(),
    title: '404',
    page: '/ 404',
    children: '<section>Missing</section>',
    canonicalUrl: 'https://example.com/404.html',
    ogUrl: 'https://cdn.example.com/404.html',
    ogType: 'article',
  });

  assert.equal(placeholders.ogUrl, 'https://cdn.example.com/404.html');
  assert.equal(placeholders.ogType, 'article');
});
