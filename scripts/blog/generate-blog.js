// Description: Generates the full blog HTML files with pagination.
import {
  readFileContent,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import {
  paginatePosts,
  readIntermediatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * Generates paginated blog HTML files.
 * @param {string} tempPostsOutputDirectory - The directory to read the posts from.
 * @param {number} postsPerPage - The number of posts per page.
 * @param {string} blogTemplatePath - The path to the blog template.
 * @param {string} tempBlogOutputPath - The directory to save the paginated blog pages.
 */
export const generatePaginatedBlogHtmlFiles = (
  tempPostsOutputDirectory,
  postsPerPage,
  blogTemplatePath,
  tempBlogOutputPath,
) => {
  ensureDirectoryExists(tempBlogOutputPath); // Ensure the directory exists
  const posts = readIntermediatePosts(tempPostsOutputDirectory);

  console.log('Read intermediate posts:', posts); // Debugging log

  const paginatedPosts = paginatePosts(posts, postsPerPage);
  console.log('Paginated posts:', paginatedPosts); // Debugging log

  paginatedPosts.forEach((pagePosts, pageIndex) => {
    const blogTemplateContent = readFileContent(blogTemplatePath);
    const dom = new JSDOM(blogTemplateContent);
    const document = dom.window.document;
    const postItemTemplate = document.querySelector('.post-item-template');
    const postLinksDiv = document.getElementById('post-links-div');

    if (!postItemTemplate || !postLinksDiv) {
      throw new Error(
        'Template or placeholder element not found in the HTML template.',
      );
    }

    // Add each post to the post links container
    pagePosts.forEach((post) => {
      const postItem = createPostItem(document, post, postItemTemplate);
      console.log(`Post item HTML after replacement: ${postItem.outerHTML}`); // Debugging log
      postLinksDiv.appendChild(postItem);
    });

    // Update pagination links
    updatePaginationLinks(document, pageIndex, paginatedPosts);

    postItemTemplate.remove();

    // Update blogContent after appending the post items
    const blogContent = document.querySelector('#blog').outerHTML;

    console.log(`Final blog HTML before writing: ${blogContent}`); // Debugging log

    const outputFilePath =
      pageIndex === 0
        ? path.join(tempBlogOutputPath, `index.html`)
        : path.join(tempBlogOutputPath, `blog-page-${pageIndex + 1}.html`);
    fs.writeFileSync(outputFilePath, blogContent);
    console.log(`(Blog.js): Generated ${outputFilePath}`);
  });
};
