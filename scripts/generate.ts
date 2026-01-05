import { generateIntermediatePostHtmlFiles } from './blog/posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/blog.js';
import { generateTagPages } from './blog/tags.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import { ensureDirectoryExists, writeFileContent } from './utils/path-and-file-utils.js';
import { parseDate } from './utils/date-utils.js';
import { processMarkdownFiles, normalizeTagForFile } from './utils/content-utils.js';
import { generateRSSFeed } from './generate-rss.js';
import { generateSitemap } from './generate-sitemap.js';
import config from './config.js';
import path from 'path';
import type { Post } from './types/index.js';

/**
 * Tags object mapping tag names to arrays of posts.
 */
type Tags = Record<string, Post[]>;

/**
 * Generates all HTML files for the static site.
 * Orchestrates the entire generation process including posts, blog pages, tag pages, and layout application.
 */
const generateAllHtmlFiles = async (): Promise<void> => {
  ensureDirectoriesExist([
    config.tempPostsOutputDirectory,
    config.tempTagsOutputDirectory,
    config.tempBlogOutputPath,
    config.publicContentOutputDirectory,
    config.publicBlogOutputPath,
    config.publicPostsOutputDirectory,
    config.publicTagsOutputDirectory,
  ]);

  console.log('(Generate.ts): Processing markdown files...');
  const truncatedPosts = processAndSortMarkdownFiles(
    config.postsContentDirectory,
    { previewLength: config.previewLength },
  );

  const fullPosts = processAndSortMarkdownFiles(config.postsContentDirectory);
  console.log(`(Generate.ts): Found ${fullPosts.length} post${fullPosts.length !== 1 ? 's' : ''}`);

  const tags = collectTags(fullPosts);
  const tagCount = Object.keys(tags).length;
  if (tagCount > 0) {
    console.log(`(Generate.ts): Found ${tagCount} tag${tagCount !== 1 ? 's' : ''}`);
  }

  await generateIntermediatePostHtmlFiles(
    fullPosts,
    config.templatePostsPath,
    config.tempPostsOutputDirectory,
  );

  generatePaginatedBlogHtmlFiles(
    truncatedPosts,
    config.postsPerPage,
    config.templateBlogPath,
    config.tempBlogOutputPath,
  );

  generateTagPages(
    tags,
    truncatedPosts,
    config.postsPerPage,
    config.templateTagsPath,
    config.templateMainTagsPath,
    config.tempTagsOutputDirectory,
  );

  applyLayoutToHtmlFiles(
    [
      {
        inputDir: config.tempPostsOutputDirectory,
        outputDir: config.publicPostsOutputDirectory,
      },
      {
        inputDir: config.tempTagsOutputDirectory,
        outputDir: config.publicTagsOutputDirectory,
      },
      {
        inputDir: config.tempBlogOutputPath,
        outputDir: config.publicBlogOutputPath,
      },
      {
        inputDir: config.contentDirectory,
        outputDir: config.publicContentOutputDirectory,
      },
    ],
    tags,
  );

  // Generate RSS feed
  const rssContent = generateRSSFeed(fullPosts);
  const rssPath = path.join(config.publicContentOutputDirectory, 'rss.xml');
  writeFileContent(rssPath, rssContent);
  console.log('(Generate.ts): Generated RSS feed -> rss.xml');

  // Generate sitemap
  const sitemapPages = [
    { url: config.siteUrl, lastmod: new Date() },
    { url: `${config.siteUrl}/blog`, lastmod: fullPosts.length > 0 ? fullPosts[0].date : new Date() },
    ...fullPosts.map((post) => ({
      url: `${config.siteUrl}/blog/posts/${post.htmlFileName}`,
      lastmod: post.date,
    })),
    // Add tag pages
    ...Object.keys(tags).map((tag) => {
      const tagPosts = fullPosts.filter((post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag));
      const latestPostDate = tagPosts.length > 0 ? tagPosts[0].date : new Date();
      return {
        url: `${config.siteUrl}/blog/tags/${normalizeTagForFile(tag)}.html`,
        lastmod: latestPostDate,
      };
    }),
    { url: `${config.siteUrl}/blog/tags`, lastmod: new Date() },
  ];

  const sitemapContent = generateSitemap(sitemapPages);
  const sitemapPath = path.join(config.publicContentOutputDirectory, 'sitemap.xml');
  writeFileContent(sitemapPath, sitemapContent);
  console.log('(Generate.ts): Generated sitemap -> sitemap.xml');
};

/**
 * Ensures multiple directories exist.
 * @param directories - Array of directory paths to ensure exist.
 */
const ensureDirectoriesExist = (directories: string[]): void => {
  directories.forEach(ensureDirectoryExists);
};

/**
 * Processes markdown files from a directory and sorts them by date.
 * @param directory - The directory containing markdown files.
 * @param options - Options for processing (e.g., previewLength).
 * @returns Array of processed and sorted posts.
 */
const processAndSortMarkdownFiles = (directory: string, options: { previewLength?: number } = {}): Post[] => {
  return processMarkdownFiles(directory, options)
    .map((post): Post => {
      // Validate required fields
      if (!post.title) {
        console.warn(`Post missing title: ${post.htmlFileName || 'unknown'}`);
      }
      if (!post.content) {
        console.warn(`Post missing content: ${post.htmlFileName || 'unknown'}`);
      }

      // Parse date with error handling
      let postDate = new Date();
      if (post.date) {
        try {
          postDate = typeof post.date === 'string' ? parseDate(post.date) : new Date(post.date);
        } catch (error) {
          const err = error as Error;
          console.warn(`Post has invalid date "${post.date}" (${post.htmlFileName || 'unknown'}): ${err.message}. Using current date.`);
        }
      }

      return {
        ...post,
        title: (post.title as string) || 'Untitled',
        date: postDate,
        tags: Array.isArray(post.tags) ? (post.tags as string[]) : [],
        content: (post.content as string) || '',
        previewContent: (post.previewContent as string) || '',
        htmlFileName: (post.htmlFileName as string) || '',
      } as Post;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

/**
 * Collects all tags from posts and groups posts by tag.
 * @param posts - Array of post objects.
 * @returns Object mapping tag names to arrays of posts.
 */
const collectTags = (posts: Post[]): Tags => {
  const tags: Tags = {};
  posts.forEach((post) => {
    // Handle posts without tags
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        if (!tags[tag]) {
          tags[tag] = [];
        }
        tags[tag].push(post);
      });
    }
  });
  return tags;
};

generateAllHtmlFiles().catch((error) => {
  console.error('Error generating HTML files:', error);
  process.exit(1);
});

