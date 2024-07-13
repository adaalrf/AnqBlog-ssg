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
 * Generates tag pages for the blog.
 * @param {object} tags - The tags with associated posts.
 * @param {array} posts - The array of posts.
 * @param {number} characters - The number of characters to display in the preview.
 * @param {number} postsPerPage - The number of posts per page.
 * @param {string} templateTagsPath - The path to the tags template.
 * @param {string} tempTagsOutputDirectory - The directory to save the paginated tag pages.
 */
export const generateTagPages = (
  tags,
  posts,
  postsPerPage,
  templateTagsPath,
  tempTagsOutputDirectory,
) => {
  ensureDirectoryExists(tempTagsOutputDirectory); // Ensure the directory exists

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags.includes(tag));
    const tagContent = paginatePosts(tagPosts, postsPerPage);

    tagContent.forEach((pagePosts, pageIndex) => {
      const templateTapsContent = readFileContent(templateTagsPath);
      const dom = new JSDOM(templateTapsContent);
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
      updatePaginationLinks(document, pageIndex, tagContent, tag);
      const blogPageTitle = document.getElementById('tagPageTitle');
      blogPageTitle.textContent = `${tag}`;
      // Save the tag page
      const content = document.querySelector('#tag').outerHTML;
      const filesWithDash = tag.split(' ').join('-');
      const outputFilePath =
        pageIndex === 0
          ? path.join(tempTagsOutputDirectory, `${filesWithDash}.html`)
          : path.join(
              tempTagsOutputDirectory,
              `${filesWithDash}-${pageIndex + 1}.html`,
            );
      fs.writeFileSync(outputFilePath, content);
      console.log(`(Tags.js): Generated tag page -> ${outputFilePath}`);
    });
  });
};
