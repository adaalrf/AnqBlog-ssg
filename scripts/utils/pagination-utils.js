import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import {
  parseHtmlFrontMatter,
  getFirstNthCharacters,
  normalizeTagForFile,
  denormalizeTagFromFile,
} from './content-utils.js';
import { readFileContent } from './path-and-file-utils.js';
import { formatDate } from './date-utils.js';

/**
 * Splits posts into pages.
 * @param {Array} posts - The array of posts.
 * @param {number} postsPerPage - The number of posts per page.
 * @returns {Array} - The paginated posts.
 */
export const paginatePosts = (posts, postsPerPage) => {
  const paginatedPosts = [];
  for (let i = 0; i < posts.length; i += postsPerPage) {
    paginatedPosts.push(posts.slice(i, i + postsPerPage));
  }
  return paginatedPosts;
};

/**
 * Creates a post item element.
 * @param {Object} post - The post data.
 * @param {HTMLElement} postItemTemplate - The post item template.
 * @param {string} [postsPath=''] - The base path for the posts links.
 * @param {string} [tagsPath=''] - The base path for the tags links.
 * @returns {HTMLElement} - The post item element.
 */
export const createPostItem = (
  post,
  postItemTemplate,
  postsPath = '',
  tagsPath = '',
) => {
  const { title, date, tags, htmlFileName, previewContent } = post;
  
  // Convert to absolute web paths from site root
  // Remove any relative path components and 'public/' prefix
  let postsWebPath = postsPath.replace(/^\.\.\//g, '').replace(/public\//g, '');
  let tagsWebPath = tagsPath.replace(/^\.\.\//g, '').replace(/public\//g, '');
  
  // Ensure paths start with /
  if (postsWebPath && !postsWebPath.startsWith('/')) {
    postsWebPath = '/' + postsWebPath;
  }
  if (tagsWebPath && !tagsWebPath.startsWith('/')) {
    tagsWebPath = '/' + tagsWebPath;
  }
  
  // Default to absolute paths if empty
  if (!postsWebPath) postsWebPath = '/blog/posts';
  if (!tagsWebPath) tagsWebPath = '/blog/tags';

  const normalizedFileName = normalizeTagForFile(htmlFileName.replace('.html', ''));
  const titleLink = `<a href="${postsWebPath}/${normalizedFileName}.html">${getFirstNthCharacters(title, 25)}</a>`;

  const postItem = postItemTemplate.cloneNode(true);
  postItem.querySelector('.post-title').innerHTML = titleLink;
  postItem.querySelector('.post-date').innerHTML = formatDate(date);
  postItem.querySelector('.content').innerHTML = previewContent;

  const tagsContainer = postItem.querySelector('.tags');
  const tagsContainerMobile = postItem.querySelector('.tags-mobile');
  const tagDivider = postItem.querySelector('#tag-divider');

  if (tagsContainer && tagsContainerMobile) {
    if (tags && tags.length > 0) {
      const tagsList = tags
        .map(
          (tag) =>
            `<a href="${tagsWebPath}/${normalizeTagForFile(tag)}.html">${denormalizeTagFromFile(tag)}</a>`,
        )
        .join(' ');

      tagsContainer.innerHTML = tagsList;
      tagsContainerMobile.innerHTML = tagsList;
    } else {
      tagsContainer.remove();
      tagsContainerMobile.remove();
      if (tagDivider) tagDivider.remove();
    }
  }

  return postItem;
};

/**
 * Updates pagination links.
 * @param {Document} document - The DOM document.
 * @param {number} pageIndex - The current page index.
 * @param {Array} paginatedPosts - The array of paginated posts.
 * @param {string} [tag=''] - The tag (if any).
 */
export const updatePaginationLinks = (
  document,
  pageIndex,
  paginatedPosts,
  tag = '',
) => {
  const paginationDiv = document.querySelector('.pagination');
  if (!paginationDiv) {
    throw new Error('Pagination template must contain an element with class "pagination"');
  }
  const previousLink = paginationDiv.querySelector('.previous-page');
  const nextLink = paginationDiv.querySelector('.next-page');
  
  if (!previousLink || !nextLink) {
    throw new Error('Pagination template must contain elements with classes "previous-page" and "next-page"');
  }
  const tagWithDash = normalizeTagForFile(tag);

  // Get the classes for normal and current page links
  const pageLink1 = document.getElementById('page-link-1');
  const pageLink3 = document.getElementById('page-link-3');
  
  if (!pageLink1 || !pageLink3) {
    throw new Error('Pagination template must contain elements with ids "page-link-1" and "page-link-3"');
  }
  
  const classesNormalPageLink = pageLink1.className.split(' ').filter(Boolean);
  const classesCurrentPageLink = pageLink3.className.split(' ').filter(Boolean);

  // Determine the range of pages to display
  const totalPages = paginatedPosts.length;

  // Helper function to update pagination links
  const updatePaginationLink = (pageLink, index, isCurrentPage) => {
    pageLink.className = '';
    const classNames = isCurrentPage
      ? classesCurrentPageLink
      : classesNormalPageLink;
    pageLink.classList.add(...classNames);
    pageLink.href =
      index === 0
        ? `${tag ? tagWithDash : 'index'}.html`
        : `${tag ? tagWithDash + '-page-' : 'blog-page-'}${index + 1}.html`;
    pageLink.textContent = index + 1;
    // Show page link only if there are multiple pages
    if (totalPages > 1) {
      pageLink.classList.remove('hidden');
    }
  };
  const startPage = Math.max(0, Math.min(totalPages - 5, pageIndex - 2));
  const endPage = Math.min(totalPages, startPage + 5);

  // Update the pagination links
  for (let i = startPage; i < endPage; i++) {
    const pageLink = paginationDiv.querySelector(
      `#page-link-${i - startPage + 1}`,
    );
    if (!pageLink) {
      throw new Error(`Pagination template must contain element with id "page-link-${i - startPage + 1}"`);
    }
    const isActivePage = i === pageIndex; // Determine if the current page is the active page
    updatePaginationLink(pageLink, i, isActivePage); // Update the pagination link with the appropriate details
  }

  // Next page link
  nextLink.classList.toggle('hidden', pageIndex >= paginatedPosts.length - 1);
  if (!nextLink.classList.contains('hidden')) {
    nextLink.href = `${tag ? tagWithDash + '-page-' : 'blog-page-'}${
      pageIndex + 2
    }.html`;
  }

  // Previous page link
  previousLink.classList.toggle('hidden', pageIndex <= 0);
  if (!previousLink.classList.contains('hidden')) {
    previousLink.href =
      pageIndex === 1
        ? `${tag ? tag : 'index'}.html`
        : `${tag ? tagWithDash + '-page-' : 'blog-page-'}${pageIndex}.html`;
  }
};
