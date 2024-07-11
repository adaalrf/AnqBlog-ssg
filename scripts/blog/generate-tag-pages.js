import {
  readIntermediatePosts,
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
 * Generates tag pages for the blog.
 * @param {object} tags - The tags with associated posts.
 * @param {string} tempPostsOutputDirectory - The directory to read the posts from.
 * @param {number} postsPerPage - The number of posts per page.
 * @param {string} blogTemplatePath - The path to the blog template.
 * @param {string} tempTagsOutputDirectory - The directory to save the tag pages.
 */
export const generateTagPages = (
  tags,
  tempPostsOutputDirectory,
  postsPerPage,
  blogTemplatePath,
  tempTagsOutputDirectory,
) => {
  ensureDirectoryExists(tempTagsOutputDirectory); // Ensure the tags directory exists

  const posts = readIntermediatePosts(tempPostsOutputDirectory);
  const paginatedPosts = paginatePosts(posts, postsPerPage);

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags.includes(tag));
    const tagContent = paginatePosts(tagPosts, postsPerPage);

    tagContent.forEach((pagePosts, pageIndex) => {
      const blogTemplateContent = readFileContent(blogTemplatePath);
      const dom = new JSDOM(blogTemplateContent);
      const document = dom.window.document;
      const postLinksDiv = document.getElementById('post-links-div');
      const postItemTemplate = document.querySelector('.post-item-template');

      if (!postItemTemplate || !postLinksDiv) {
        throw new Error(
          'Template or placeholder element not found in the HTML template.',
        );
      }

      pagePosts.forEach((post) => {
        const postItem = createPostItem(
          document,
          post,
          postItemTemplate,
          `../../${config.publicPostsOutputDirectory}`,
          `../../${config.publicTagsOutputDirectory}`,
        );
        postLinksDiv.appendChild(postItem);
      });

      updatePaginationLinks(document, pageIndex, tagContent, tag);

      postItemTemplate.remove();
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
