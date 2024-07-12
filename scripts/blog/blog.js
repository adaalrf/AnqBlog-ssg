import {
  paginatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';
import {
  readFileContent,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import path from 'path';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import config from '../config.js';

/**
 * Generates paginated blog HTML files.
 * @param {object} tags - The tags with associated posts.
 * @param {array} posts - The array of posts.
 * @param {number} postsPerPage - The number of posts per page.
 * @param {string} templateBlogPath - The path to the blog template.
 * @param {string} tempBlogOutputPath - The directory to save the paginated blog pages.
 */
export const generatePaginatedBlogHtmlFiles = (
  tags,
  posts,
  postsPerPage,
  templateBlogPath,
  tempBlogOutputPath,
) => {
  ensureDirectoryExists(tempBlogOutputPath); // Ensure the directory exists

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags.includes(tag));
    const tagContent = paginatePosts(tagPosts, postsPerPage);

    tagContent.forEach((pagePosts, pageIndex) => {
      const blogTemplateContent = readFileContent(templateBlogPath);
      const dom = new JSDOM(blogTemplateContent);
      const document = dom.window.document;
      const postItemTemplate = document.querySelector('.post-item');
      const postLinksDiv = document.getElementById('post-links-div');

      // Add each post to the post links container
      pagePosts.forEach((post) => {
        const postItem = createPostItem(
          post,
          postItemTemplate,
          `../../${config.publicPostsOutputDirectory}`,
          `../../${config.publicTagsOutputDirectory}`,
        );
        postLinksDiv.appendChild(postItem);
      });

      postItemTemplate.remove();
      updatePaginationLinks(document, pageIndex, tagContent);

      // Save the tag page
      const content = document.querySelector('#blog').outerHTML;
      //const filesWithDash = tag.split(' ').join('-');
      const outputFilePath =
        pageIndex === 0
          ? path.join(tempBlogOutputPath, `index.html`)
          : path.join(tempBlogOutputPath, `-page-${pageIndex + 1}.html`);
      fs.writeFileSync(outputFilePath, content);
      console.log(`(Blog.js): Generated ${outputFilePath}`);
    });
  });
};
