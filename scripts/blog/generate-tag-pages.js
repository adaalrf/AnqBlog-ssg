// Description: Generates tag pages for the blog.
import {
  readFileContent,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import {
  paginatePosts,
  readIntermediatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';

/**
 * Generates tag pages.
 * @param {object} tags - The tags with associated posts.
 * @param {string} tempPostsOutputDirectory - The directory to read the posts from.
 * @param {string} blogTemplatePath - The path to the blog template.
 * @param {string} tempTagsOutputDirectory - The directory to save the tag pages.
 */
export const generateTagPages = (
  tags,
  tempPostsOutputDirectory,
  blogTemplatePath,
  tempTagsOutputDirectory,
) => {
  ensureDirectoryExists(tempTagsOutputDirectory); // Ensure the tags directory exists

  const posts = readIntermediatePosts(tempPostsOutputDirectory);

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags.includes(tag));
    const paginatedPosts = paginatePosts(tagPosts, 5);

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
      updatePaginationLinks(document, pageIndex, paginatedPosts, tag);

      postItemTemplate.remove();

      // Update tagPageContent after appending the post items
      const tagPageContent = document.querySelector('#blog').outerHTML;

      const outputPath =
        pageIndex === 0
          ? path.join(tempTagsOutputDirectory, `${tag}.html`)
          : path.join(
              tempTagsOutputDirectory,
              `${tag}-blog-page-${pageIndex + 1}.html`,
            );

      fs.writeFileSync(outputPath, tagPageContent);
      console.log(`Generated content for tag page ${tag}: ${outputPath}`);
    });
  });
};
