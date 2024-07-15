import {
  paginatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';
import {
  readFileContent,
  ensureDirectoryExists,
  generateFrontMatter,
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
  posts,
  postsPerPage,
  templateBlogPath,
  tempBlogOutputPath,
) => {
  ensureDirectoryExists(tempBlogOutputPath); // Ensure the directory exists

  const blogContent = paginatePosts(posts, postsPerPage);

  const blogTemplateContent = readFileContent(templateBlogPath);
  const dom = new JSDOM(blogTemplateContent);
  const document = dom.window.document;
  const postItemTemplate = document.querySelector('.post-item');
  const postLinksDiv = document.getElementById('post-links-div');
  const postIndex = [...Array(blogContent.length).keys()];

  // Add each post to the post links container
  posts.forEach((post) => {
    const postItem = createPostItem(
      post,
      postItemTemplate,
      `../../${config.publicPostsOutputDirectory}`,
      `../../${config.publicTagsOutputDirectory}`,
    );
    postLinksDiv.appendChild(postItem);
  });

  postItemTemplate.remove();

  // For each page
  postIndex.forEach((post, pageIndex) => {
    updatePaginationLinks(document, pageIndex, blogContent);
    // Save the tag page
    const content = document.querySelector('#blog').outerHTML;
    //const filesWithDash = tag.split(' ').join('-');
    const outputFilePath =
      post === 0
        ? path.join(tempBlogOutputPath, `index.html`)
        : path.join(tempBlogOutputPath, `-page-${post + 1}.html`);

    const modifiedPathBar = `<em>Blog</em>`;
    // Add dynamic front matter to the content
    const finalHtml = `${generateFrontMatter(post, {
      page: modifiedPathBar,
    })}\n${content}`;

    fs.writeFileSync(outputFilePath, finalHtml);
    console.log(`(Blog.js): Generated blog page -> ${outputFilePath}`);
  });
};
