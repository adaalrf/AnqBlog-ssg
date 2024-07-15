import path from 'path';
import { JSDOM } from 'jsdom';
import { createPostItem } from '../utils/pagination-utils.js';
import {
  generateFrontMatter, // Import the helper function
} from '../utils/content-utils.js';
import {
  ensureDirectoryExists,
  writeFileContent,
  readFileContent,
} from '../utils/path-and-file-utils.js';
import config from '../config.js';

/**
 * Generates intermediate post HTML files.
 * @param {Array} posts - The array of posts.
 * @param {string} postTemplatePath - The path to the post template.
 * @param {string} tempPostsOutputDirectory - The directory to save the generated files.
 */
export const generateIntermediatePostHtmlFiles = (
  posts,
  postTemplatePath,
  tempPostsOutputDirectory,
) => {
  ensureDirectoryExists(tempPostsOutputDirectory);

  posts.forEach((post) => {
    const templateContent = readFileContent(postTemplatePath);
    const dom = new JSDOM(templateContent);
    const document = dom.window.document;
    const postItemTemplate = document.querySelector('#post-content');
    const postItem = createPostItem(
      post,
      postItemTemplate,
      `../../${config.publicPostsOutputDirectory}`,
      `../../${config.publicTagsOutputDirectory}`,
    );
    const filesWithDash = post.htmlFileName.split(' ').join('-');
    const htmlContent = postItem.outerHTML;
    const outputPath = path.join(tempPostsOutputDirectory, filesWithDash);

    const modifiedPathBar = `/ <a href=/blog>Blog</a> / <em>${post.title}</em>`;
    // Add dynamic front matter to the content
    const finalHtml = `${generateFrontMatter(post, {
      page: modifiedPathBar,
    })}\n${htmlContent}`;

    writeFileContent(outputPath, finalHtml);
    console.log(`(Posts.js): Generated post -> ${outputPath}`);
  });
};
