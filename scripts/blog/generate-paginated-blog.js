// Description: Generates the full blog HTML files with pagination.
import {
  readFileContent,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { formatDate } from '../utils/date-utils.js';

/**
 * Splits posts into pages.
 * @param {Array} posts - The array of posts.
 * @param {number} postsPerPage - The number of posts per page.
 * @returns {Array} - The paginated posts.
 */
const paginatePosts = (posts, postsPerPage) => {
  const paginatedPosts = [];
  for (let i = 0; i < posts.length; i += postsPerPage) {
    paginatedPosts.push(posts.slice(i, i + postsPerPage));
  }
  return paginatedPosts;
};

/**
 * Generates paginated blog HTML files.
 * @param {Array} posts - The array of posts.
 * @param {number} postsPerPage - The number of posts per page.
 * @param {string} blogTemplatePath - The path to the blog template.
 * @param {string} tempBlogOutputPath - The directory to save the paginated blog pages.
 */
export const generatePaginatedBlogHtmlFiles = (
  posts,
  postsPerPage,
  blogTemplatePath,
  tempBlogOutputPath,
) => {
  ensureDirectoryExists(tempBlogOutputPath); // Ensure the directory exists
  const paginatedPosts = paginatePosts(posts, postsPerPage);

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

    // Helper function to create a post item element
    const createPostItem = (post) => {
      const { title, date, tags, htmlFileName, previewContent } = post;
      const titleLink = `<a href="./posts/${htmlFileName}">${title}</a>`;

      const postItem = postItemTemplate.cloneNode(true);
      postItem.style.display = 'list-item';
      postItem.querySelector('.post-title').innerHTML = titleLink;
      postItem.querySelector('.post-date').innerHTML = formatDate(date);
      postItem.querySelector('.content').innerHTML = previewContent;

      const tagsContainer = postItem.querySelector('.tags');
      const tagDivider = postItem.querySelector('#tag-divider');

      if (tagsContainer) {
        if (tags && tags.length > 0) {
          const tagsList = tags
            .map((tag) => `<a href="./tags/${tag}.html">${tag}</a>`)
            .join(' ');
          tagsContainer.innerHTML = tagsList;
        } else {
          tagsContainer.remove();
          if (tagDivider) tagDivider.remove();
        }
      }

      return postItem;
    };

    // Add each post to the post links container
    pagePosts.forEach((post) => postLinksDiv.appendChild(createPostItem(post)));

    // Helper function to update pagination links
    const updatePaginationLink = (pageLink, index, isCurrentPage) => {
      pageLink.className = '';
      const classNames = isCurrentPage
        ? classesCurrentPageLink
        : classesNormalPageLink;
      pageLink.classList.add(...classNames);
      pageLink.href =
        index === 0 ? 'index.html' : `blog-page-${index + 1}.html`;
      pageLink.textContent = index + 1;
      pageLink.classList.remove('hidden');
    };

    // Determine the range of pages to display
    const totalPages = paginatedPosts.length;
    const startPage = Math.max(0, Math.min(totalPages - 5, pageIndex - 2));
    const endPage = Math.min(totalPages, startPage + 5);

    const paginationDiv = document.querySelector('.pagination');
    const previousLink = paginationDiv.querySelector('.previous-blog-page');
    const nextLink = paginationDiv.querySelector('.next-blog-page');

    const classesNormalPageLink = document
      .getElementById('page-link-1')
      .className.split(' ');
    const classesCurrentPageLink = document
      .getElementById('page-link-3')
      .className.split(' ');

    // Update pagination links
    for (let i = startPage; i < endPage; i++) {
      const pageLink = paginationDiv.querySelector(
        `#page-link-${i - startPage + 1}`,
      );
      const isActivePage = i === pageIndex; // Determine if the current page is the active page
      updatePaginationLink(pageLink, i, isActivePage); // Update the pagination link with the appropriate details
    }

    // Next page link
    nextLink.classList.toggle('hidden', pageIndex >= paginatedPosts.length - 1);
    if (!nextLink.classList.contains('hidden')) {
      nextLink.href = `blog-page-${pageIndex + 2}.html`;
    }

    // Previous page link
    previousLink.classList.toggle('hidden', pageIndex <= 0);
    if (!previousLink.classList.contains('hidden')) {
      previousLink.href =
        pageIndex === 1 ? 'index.html' : `blog-page-${pageIndex}.html`;
    }

    postLinksDiv.appendChild(paginationDiv);
    postItemTemplate.remove();

    const blogContent = document.querySelector('#blog').outerHTML;
    const outputFilePath =
      pageIndex === 0
        ? path.join(tempBlogOutputPath, `index.html`)
        : path.join(tempBlogOutputPath, `blog-page-${pageIndex + 1}.html`);
    fs.writeFileSync(outputFilePath, blogContent);
    console.log(
      `Generated content for blog page ${pageIndex + 1}: ${outputFilePath}`,
    );
  });
};
