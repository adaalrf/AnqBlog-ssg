import path from 'path';
import config from './config.js';
import { generateIntermediatePostHtmlFiles } from './blog/posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/blog.js';
import { generateTagPages } from './blog/tags.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import { ensureDirectoryExists, writeFileContent } from './utils/path-and-file-utils.js';
import { parseDate } from './utils/date-utils.js';
import { processMarkdownFiles, getTagSlug } from './utils/content-utils.js';
import { generateRSSFeed } from './generate-rss.js';
import { generateSitemap } from './generate-sitemap.js';
import { formatError } from './utils/error-utils.js';
import { logger } from './utils/logger.js';
import type { Post, Tags } from './types/index.js';

/**
 * Generates all HTML files for the static site.
 * Orchestrates the entire generation process including posts, blog pages, tag pages, and layout application.
 * @throws {Error} If markdown processing, file generation, or layout application fails.
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

  logger.info('generate.ts', 'Processing markdown files...');
  const truncatedPosts = await processAndSortMarkdownFiles(config.postsContentDirectory, {
    previewLength: config.previewLength,
    maxFileSize: config.maxMarkdownFileSize,
  });

  const fullPosts = await processAndSortMarkdownFiles(config.postsContentDirectory, {
    maxFileSize: config.maxMarkdownFileSize,
  });
  logger.info('generate.ts', `Found ${fullPosts.length} post${fullPosts.length !== 1 ? 's' : ''}`);

  const tags = collectTags(fullPosts);
  const tagCount = Object.keys(tags).length;
  if (tagCount > 0) {
    logger.info('generate.ts', `Found ${tagCount} tag${tagCount !== 1 ? 's' : ''}`);
  }

  await generateIntermediatePostHtmlFiles(
    fullPosts,
    config.templatePostsPath,
    config.tempPostsOutputDirectory,
  );

  await generatePaginatedBlogHtmlFiles(
    truncatedPosts,
    config.postsPerPage,
    config.templateBlogPath,
    config.tempBlogOutputPath,
  );

  await generateTagPages(
    tags,
    truncatedPosts,
    config.postsPerPage,
    config.templateMainTagsPath,
    config.tempTagsOutputDirectory,
  );

  await applyLayoutToHtmlFiles(
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
  await writeFileContent(rssPath, rssContent);
  logger.info('generate.ts', 'Generated RSS feed -> rss.xml');

  // Generate sitemap
  const sitemapPages = [
    { url: config.siteUrl, lastmod: new Date() },
    {
      url: `${config.siteUrl}/blog`,
      lastmod: fullPosts.length > 0 ? fullPosts[0].date : new Date(),
    },
    ...fullPosts.map((post) => ({
      url: `${config.siteUrl}/blog/posts/${post.htmlFileName}`,
      lastmod: post.date,
    })),
    // Add tag pages
    ...Object.keys(tags).map((tag) => {
      const tagPosts = fullPosts.filter(
        (post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag),
      );
      const latestPostDate = tagPosts.length > 0 ? tagPosts[0].date : new Date();
      return {
        url: `${config.siteUrl}/blog/tags/${getTagSlug(tag)}.html`,
        lastmod: latestPostDate,
      };
    }),
    { url: `${config.siteUrl}/blog/tags`, lastmod: new Date() },
  ];

  const sitemapContent = generateSitemap(sitemapPages);
  const sitemapPath = path.join(config.publicContentOutputDirectory, 'sitemap.xml');
  await writeFileContent(sitemapPath, sitemapContent);
  logger.info('generate.ts', 'Generated sitemap -> sitemap.xml');
};

/**
 * Ensures multiple directories exist.
 * @param directories - Array of directory paths to ensure exist.
 * @throws {Error} If any directory path is invalid or creation fails.
 */
const ensureDirectoriesExist = (directories: string[]): void => {
  directories.forEach(ensureDirectoryExists);
};

/**
 * Processes markdown files from a directory and sorts them by date.
 * @param directory - The directory containing markdown files.
 * @param options - Options for processing (e.g., previewLength, maxFileSize).
 * @returns Promise that resolves to an array of processed and sorted posts.
 * @throws {Error} If directory cannot be read or markdown processing fails.
 */
const processAndSortMarkdownFiles = async (
  directory: string,
  options: { previewLength?: number; maxFileSize?: number } = {},
): Promise<Post[]> => {
  const posts = await processMarkdownFiles(directory, options);
  return posts
    .map((post): Post => {
      // Validate required fields
      if (!post.title) {
        logger.warn('generate.ts', `Post missing title: ${post.htmlFileName || 'unknown'}`);
      }
      if (!post.content) {
        logger.warn('generate.ts', `Post missing content: ${post.htmlFileName || 'unknown'}`);
      }

      // Parse date with error handling
      let postDate = new Date();
      if (post.date) {
        try {
          postDate = typeof post.date === 'string' ? parseDate(post.date) : new Date(post.date);
        } catch (error) {
          const err = error as Error;
          logger.warn(
            'generate.ts',
            `Post has invalid date "${String(post.date)}" (${post.htmlFileName || 'unknown'}): ${err.message}. Using current date.`,
          );
        }
      }

      return {
        ...post,
        title: (post.title as string) || 'Untitled',
        date: postDate,
        tags: Array.isArray(post.tags) ? post.tags : [],
        content: (post.content as string) || '',
        previewContent: (post.previewContent as string) || '',
        htmlFileName: (post.htmlFileName as string) || '',
      } as Post;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

/**
 * Collects all tags from posts and groups posts by tag.
 * Normalizes tags (trim whitespace) and filters empty tags to prevent issues.
 * @param posts - Array of post objects.
 * @returns Object mapping tag names to arrays of posts.
 */
const collectTags = (posts: Post[]): Tags => {
  const tags: Tags = {};
  posts.forEach((post) => {
    // Handle posts without tags
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        // Normalize tag: trim whitespace and filter empty
        const normalizedTag = typeof tag === 'string' ? tag.trim() : String(tag).trim();
        // Skip empty tags
        if (!normalizedTag) {
          return;
        }
        if (!tags[normalizedTag]) {
          tags[normalizedTag] = [];
        }
        tags[normalizedTag].push(post);
      });
    }
  });
  return tags;
};

generateAllHtmlFiles().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('generate.ts', formatError(err, 'Error generating HTML files'));
  process.exit(1);
});
