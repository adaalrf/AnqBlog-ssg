import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { readFileContent, parseHtmlFrontMatter } from './parsing-utils.js';
import { formatDate } from './date-utils.js';
import { rp, fr, fpr } from './resolve-path.js';
import config from '../config.js';

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
 * Reads intermediate posts from a directory.
 * @param {string} tempPostsOutputDirectory - The directory to read the posts from.
 * @returns {Array} - The array of intermediate posts.
 */
export const readIntermediatePosts = (tempPostsOutputDirectory) => {
  if (typeof tempPostsOutputDirectory !== 'string') {
    throw new TypeError('tempPostsOutputDirectory should be a string');
  }

  const files = fs.readdirSync(tempPostsOutputDirectory);
  return files
    .filter((file) => file.endsWith('.html'))
    .map((file) => {
      const filePath = path.join(tempPostsOutputDirectory, file);
      const fileContent = readFileContent(filePath);
      const { data, content } = parseHtmlFrontMatter(fileContent);
      const dom = new JSDOM(content);
      const document = dom.window.document;

      const title = document.querySelector('.post-title')?.textContent;
      const date = new Date(document.querySelector('.post-date')?.textContent);
      const tags = Array.from(document.querySelectorAll('.tags a')).map(
        (tag) => tag.textContent,
      );
      const previewContent = document.querySelector('.content')?.innerHTML;

      return { title, date, tags, htmlFileName: file, previewContent };
    });
};

/**
 * Creates a post item element.
 * @param {Document} document - The DOM document.
 * @param {Object} post - The post data.
 * @param {HTMLElement} postItemTemplate - The post item template.
 * @param {string} [basePath='.'] - The base path for the links.
 * @returns {HTMLElement} - The post item element.
 */
export const createPostItem = (
  post,
  postItemTemplate,
  postsPath = '', // fpr('.') to find root path from current directory
  tagsPath = '', // fpr('tags') to find tags path from current directory
) => {
  const { title, date, tags, htmlFileName, previewContent } = post;
  const postsPathSansPublic = postsPath.replace('public/', '');
  const tagsPathSansPublic = tagsPath.replace('public/', '');

  const titleLink = `<a href="${postsPathSansPublic}/${htmlFileName
    .split(' ')
    .join('-')}">${title}</a>`;

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
        .map(
          (tag) =>
            `<a href="${tagsPathSansPublic}/${tag
              .split(' ')
              .join('-')}.html">${tag}</a>`,
        )
        .join(' ');

      tagsContainer.innerHTML = tagsList;
    } else {
      tagsContainer.remove();
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
  const previousLink = paginationDiv.querySelector('.previous-page');
  const nextLink = paginationDiv.querySelector('.next-page');
  const tagWithDash = tag.split(' ').join('-');

  // Get the classes for normal and current page links
  const classesNormalPageLink = document
    .getElementById('page-link-1')
    .className.split(' ');
  const classesCurrentPageLink = document
    .getElementById('page-link-3')
    .className.split(' ');

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
    pageLink.classList.remove('hidden');
  };

  // Determine the range of pages to display
  const totalPages = paginatedPosts.length;
  const startPage = Math.max(0, Math.min(totalPages - 5, pageIndex - 2));
  const endPage = Math.min(totalPages, startPage + 5);

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
