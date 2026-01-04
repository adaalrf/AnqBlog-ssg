import { generateIntermediatePostHtmlFiles } from './blog/posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/blog.js';
import { generateTagPages } from './blog/tags.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import { ensureDirectoryExists } from './utils/path-and-file-utils.js';
import { parseDate } from './utils/date-utils.js';
import { processMarkdownFiles } from './utils/content-utils.js';
import config from './config.js';

/**
 * Generates all HTML files for the static site.
 * Orchestrates the entire generation process including posts, blog pages, tag pages, and layout application.
 */
const generateAllHtmlFiles = () => {
  ensureDirectoriesExist([
    config.tempPostsOutputDirectory,
    config.tempTagsOutputDirectory,
    config.tempBlogOutputPath,
    config.publicContentOutputDirectory,
    config.publicBlogOutputPath,
    config.publicPostsOutputDirectory,
    config.publicTagsOutputDirectory,
  ]);

  const truncatedPosts = processAndSortMarkdownFiles(
    config.postsContentDirectory,
    { previewLength: config.previewLength },
  );

  const fullPosts = processAndSortMarkdownFiles(config.postsContentDirectory);

  const tags = collectTags(fullPosts);

  generateIntermediatePostHtmlFiles(
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
};

/**
 * Ensures multiple directories exist.
 * @param {Array<string>} directories - Array of directory paths to ensure exist.
 */
const ensureDirectoriesExist = (directories) => {
  directories.forEach(ensureDirectoryExists);
};

/**
 * Processes markdown files from a directory and sorts them by date.
 * @param {string} directory - The directory containing markdown files.
 * @param {Object} [options={}] - Options for processing (e.g., previewLength).
 * @returns {Array<Object>} - Array of processed and sorted posts.
 */
const processAndSortMarkdownFiles = (directory, options = {}) => {
  return processMarkdownFiles(directory, options)
    .map((post) => {
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
          postDate = parseDate(post.date);
        } catch (error) {
          console.warn(`Post has invalid date "${post.date}" (${post.htmlFileName || 'unknown'}): ${error.message}. Using current date.`);
        }
      }
      
      return {
        ...post,
        title: post.title || 'Untitled',
        date: postDate,
        tags: Array.isArray(post.tags) ? post.tags : [],
        content: post.content || '',
      };
    })
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));
};

/**
 * Collects all tags from posts and groups posts by tag.
 * @param {Array<Object>} posts - Array of post objects.
 * @returns {Object} - Object mapping tag names to arrays of posts.
 */
const collectTags = (posts) => {
  const tags = {};
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

generateAllHtmlFiles();
