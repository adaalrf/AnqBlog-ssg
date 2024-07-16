// generate.js

import { generateIntermediatePostHtmlFiles } from './blog/posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/blog.js';
import { generateTagPages } from './blog/tags.js';
import { applyLayoutToHtmlFiles } from './apply-layout.js';
import { ensureDirectoryExists } from './utils/path-and-file-utils.js';
import { parseDate } from './utils/date-utils.js';
import { processMarkdownFiles } from './utils/content-utils.js';
import config from './config.js';

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

const ensureDirectoriesExist = (directories) => {
  directories.forEach(ensureDirectoryExists);
};

const processAndSortMarkdownFiles = (directory, options = {}) => {
  return processMarkdownFiles(directory, options)
    .map((post) => ({
      ...post,
      date: post.date ? parseDate(post.date) : new Date(),
    }))
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));
};

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

generateAllHtmlFiles();
