import { generateIntermediatePostHtmlFiles } from './blog/generate-posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/generate-blog.js';
import { generateTagPages } from './blog/generate-tag-pages.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import {
  processMarkdownFiles,
  ensureDirectoryExists,
} from './utils/parsing-utils.js';
import { parseDate } from './utils/date-utils.js';
import config from './config.js';
import fs from 'fs';

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
  const posts = processMarkdownFiles(config.postsContentDirectory)
    .map((post) => ({ ...post, date: parseDate(post.date) }))
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));

  // Collect all tags
  const tags = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tags[tag]) {
        tags[tag] = [];
      }
      tags[tag].push(post);
    });
  });

  generateIntermediatePostHtmlFiles(
    posts,
    config.templatePostsPath,
    config.tempPostsOutputDirectory,
  );
  generatePaginatedBlogHtmlFiles(
    config.tempPostsOutputDirectory,
    5,
    config.templateBlogPath,
    config.tempBlogOutputPath,
  );
  generateTagPages(
    tags,
    config.tempPostsOutputDirectory,
    config.templateBlogPath,
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
