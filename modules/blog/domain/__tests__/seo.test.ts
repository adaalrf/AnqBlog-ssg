import assert from 'node:assert';
import { test } from 'node:test';
import type { Config } from '../../../../core/types/config.js';
import { buildBlogSitemapPages } from '../seo.js';
import type { BlogModuleConfig, Post, Tags } from '../../types.js';

const createConfig = (): Config & BlogModuleConfig => ({
  siteName: 'Test Site',
  siteDescription: 'Test Description',
  siteUrl: 'https://example.com',
  githubUrl: 'https://github.com/example',
  authorName: 'example',
  copyrightYear: 2026,
  dateLocale: 'en-US',
  siteLanguage: 'en',
  inputCSS: '/tmp/in.css',
  outputCSS: '/tmp/out.css',
  contentDirectory: '/tmp/content',
  template404Path: '/tmp/404.html',
  mainLayoutPath: '/tmp/layout.html',
  publicContentOutputDirectory: '/tmp/public',
  themes: ['dark'],
  defaultTheme: 'dark',
  modules: ['blog'],
  postsPerPage: 5,
  previewLength: 200,
  titleTruncationLength: 25,
  titleTruncationLengthBreadcrumb: 20,
  paginationWindowSize: 5,
  maxMarkdownFileSize: 1024,
  postsContentDirectory: '/tmp/posts',
  templatePostsPath: '/tmp/post-template.html',
  templateBlogPath: '/tmp/blog-template.html',
  templateMainTagsPath: '/tmp/tags-template.html',
  tempPostsOutputDirectory: '/tmp/.build/posts',
  tempTagsOutputDirectory: '/tmp/.build/tags',
  tempBlogOutputPath: '/tmp/.build/blog',
  publicBlogOutputPath: '/tmp/public/blog',
  publicPostsOutputDirectory: '/tmp/public/blog/posts',
  publicTagsOutputDirectory: '/tmp/public/blog/tags',
});

const createPosts = (): Post[] => [
  {
    title: 'Post A',
    date: new Date('2026-01-02T00:00:00.000Z'),
    tags: ['alpha', 'beta'],
    content: '<p>A</p>',
    previewContent: '<p>A</p>',
    htmlFileName: 'post-a.html',
  },
  {
    title: 'Post B',
    date: new Date('2026-01-01T00:00:00.000Z'),
    tags: ['beta'],
    content: '<p>B</p>',
    previewContent: '<p>B</p>',
    htmlFileName: 'post-b.html',
  },
];

test('buildBlogSitemapPages: includes site, blog, posts, tags, and tags index', () => {
  const config = createConfig();
  const posts = createPosts();
  const tags: Tags = {
    alpha: [posts[0]],
    beta: [posts[0], posts[1]],
  };

  const pages = buildBlogSitemapPages(posts, tags, config);
  const urls = pages.map((page) => page.url);

  assert.ok(urls.includes('https://example.com'));
  assert.ok(urls.includes('https://example.com/blog'));
  assert.ok(urls.includes('https://example.com/blog/posts/post-a.html'));
  assert.ok(urls.includes('https://example.com/blog/posts/post-b.html'));
  assert.ok(urls.includes('https://example.com/blog/tags/alpha.html'));
  assert.ok(urls.includes('https://example.com/blog/tags/beta.html'));
  assert.ok(urls.includes('https://example.com/blog/tags'));
});
