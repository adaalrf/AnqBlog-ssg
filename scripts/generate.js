import { generateIntermediatePostHtmlFiles } from './blog/posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/blog.js';
import { generateTagPages } from './blog/tags.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import {
  processMarkdownFiles,
  ensureDirectoryExists,
} from './utils/parsing-utils.js';
import { parseDate } from './utils/date-utils.js';
import config from './config.js';

/**
 * Generates all HTML files by processing markdown content, generating intermediate and final HTML files,
 * and applying layouts.
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
    { previewLength: 100 },
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
    5,
    config.templateBlogPath,
    config.tempBlogOutputPath,
  );

  generateTagPages(
    tags,
    truncatedPosts,
    5, // Assuming 5 posts per page for tags as well
    config.templateTagsPath,
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
 * Ensures that a list of directories exist, creating them if necessary.
 * @param {string[]} directories - The list of directories to ensure exist.
 */
const ensureDirectoriesExist = (directories) => {
  directories.forEach(ensureDirectoryExists);
};

/**
 * Processes markdown files in a directory and sorts them by date.
 * @param {string} directory - The directory containing markdown files.
 * @param {object} [options] - Options for processing markdown files.
 * @returns {Array} - An array of processed and sorted posts.
 */
const processAndSortMarkdownFiles = (directory, options = {}) => {
  return processMarkdownFiles(directory, options)
    .map((post) => ({ ...post, date: parseDate(post.date) }))
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));
};

/**
 * Collects tags from a list of posts.
 * @param {Array} posts - The array of posts.
 * @returns {object} - An object with tags as keys and arrays of associated posts as values.
 */
const collectTags = (posts) => {
  const tags = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tags[tag]) {
        tags[tag] = [];
      }
      tags[tag].push(post);
    });
  });
  return tags;
};

// Execute the HTML file generation
generateAllHtmlFiles();
