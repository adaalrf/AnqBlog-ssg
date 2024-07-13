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

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(config.tempPostsOutputDirectory);
  ensureDirectoryExists(config.tempTagsOutputDirectory);
  ensureDirectoryExists(config.tempBlogOutputPath);
  ensureDirectoryExists(config.publicContentOutputDirectory);
  ensureDirectoryExists(config.publicBlogOutputPath);
  ensureDirectoryExists(config.publicPostsOutputDirectory);
  ensureDirectoryExists(config.publicTagsOutputDirectory);

  // Ensure all dates are parsed as Date objects
  const truncatedPosts = processMarkdownFiles(config.postsContentDirectory, {
    previewLength: 100,
  })
    .map((post) => ({ ...post, date: parseDate(post.date) }))
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));

  const fullPosts = processMarkdownFiles(config.postsContentDirectory)
    .map((post) => ({ ...post, date: parseDate(post.date) }))
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));

  // Collect all tags
  const tags = {};
  fullPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tags[tag]) {
        tags[tag] = [];
      }
      tags[tag].push(post);
    });
  });

  generateIntermediatePostHtmlFiles(
    fullPosts,
    config.templatePostsPath,
    config.tempPostsOutputDirectory,
    '',
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

  const directoryPairs = [
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
  ];

  applyLayoutToHtmlFiles(directoryPairs, tags);
};

// Execute the HTML file generation
generateAllHtmlFiles();
