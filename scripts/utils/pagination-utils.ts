import path from 'path';
import {
  getFirstNthCharacters,
  denormalizeTagFromFile,
  escapeHtml,
  getTagSlug,
} from './content-utils.js';
import { filePathToWebPath, sanitizeFilename } from './path-and-file-utils.js';
import { formatDate, formatDateISO } from './date-utils.js';
import config from '../config.js';
import type { Post } from '../types/index.js';

/**
 * Splits posts into pages.
 * @param posts - The array of posts.
 * @param postsPerPage - The number of posts per page.
 * @returns The paginated posts.
 */
export const paginatePosts = (posts: Post[], postsPerPage: number): Post[][] => {
  const paginatedPosts: Post[][] = [];
  for (let i = 0; i < posts.length; i += postsPerPage) {
    paginatedPosts.push(posts.slice(i, i + postsPerPage));
  }
  return paginatedPosts;
};

/**
 * Creates a post item element.
 * @param post - The post data.
 * @param postItemTemplate - The post item template.
 * @param postsPath - The base path for the posts links.
 * @param tagsPath - The base path for the tags links.
 * @returns The post item element.
 */
export const createPostItem = (
  post: Post,
  postItemTemplate: Element,
  postsPath: string = '',
  tagsPath: string = '',
): Element => {
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

  const normalizedFileName = sanitizeFilename(htmlFileName);
  // Escape title to prevent XSS attacks
  const escapedTitle = escapeHtml(
    getFirstNthCharacters(
      title,
      (config as { titleTruncationLength: number }).titleTruncationLength,
    ),
  );
  const titleLink = `<a href="${postsWebPath}/${normalizedFileName}">${escapedTitle}</a>`;

  const postItem = postItemTemplate.cloneNode(true) as Element;
  const titleElement = postItem.querySelector('.post-title');
  if (titleElement) {
    titleElement.innerHTML = titleLink;
  }

  // Update time element with ISO date and formatted display
  const dateElement = postItem.querySelector('.post-date');
  if (dateElement) {
    dateElement.setAttribute('datetime', formatDateISO(date));
    dateElement.textContent = formatDate(date);
  }

  const contentElement = postItem.querySelector('.content');
  if (contentElement) {
    contentElement.innerHTML = previewContent;
  }

  const tagsContainer = postItem.querySelector('.tags');
  const tagsContainerMobile = postItem.querySelector('.tags-mobile');
  const tagDivider = postItem.querySelector('#tag-divider');

  if (tagsContainer && tagsContainerMobile) {
    if (tags && tags.length > 0) {
      // Escape tag display text to prevent XSS attacks
      const tagsList = tags
        .map(
          (tag) =>
            `<a href="${tagsWebPath}/${getTagSlug(tag)}.html">${escapeHtml(denormalizeTagFromFile(tag))}</a>`,
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
 * @param document - The DOM document.
 * @param pageIndex - The current page index.
 * @param paginatedPosts - The array of paginated posts.
 * @param tag - The tag (if any).
 * @param outputDir - The output directory path (e.g., config.publicBlogOutputPath).
 * @param publicDir - The public directory path (e.g., config.publicContentOutputDirectory).
 */
export const updatePaginationLinks = (
  document: Document,
  pageIndex: number,
  paginatedPosts: Post[][],
  tag: string = '',
  outputDir: string | null = null,
  publicDir: string | null = null,
): void => {
  const paginationDiv = document.querySelector('.pagination');
  if (!paginationDiv) {
    throw new Error('Pagination template must contain an element with class "pagination"');
  }
  const previousLink = paginationDiv.querySelector('.previous-page') as HTMLAnchorElement;
  const nextLink = paginationDiv.querySelector('.next-page') as HTMLAnchorElement;

  if (!previousLink || !nextLink) {
    throw new Error(
      'Pagination template must contain elements with classes "previous-page" and "next-page"',
    );
  }
  const tagWithDash = getTagSlug(tag);

  /**
   * Helper function to get web path from file path, with fallback.
   * @param fileName - The filename (e.g., 'index.html', 'blog-page-2.html').
   * @param fallbackPath - Fallback path if outputDir/publicDir not provided.
   * @returns The web path.
   */
  const getWebPath = (fileName: string, fallbackPath: string): string => {
    if (outputDir && publicDir) {
      const filePath = path.join(outputDir, fileName);
      return filePathToWebPath(filePath, publicDir);
    }
    return fallbackPath;
  };

  // Get the classes for normal and current page links
  const pageLink1 = document.getElementById('page-link-1');
  const pageLink3 = document.getElementById('page-link-3');

  if (!pageLink1 || !pageLink3) {
    throw new Error(
      'Pagination template must contain elements with ids "page-link-1" and "page-link-3"',
    );
  }

  const classesNormalPageLink = pageLink1.className.split(' ').filter(Boolean);
  const classesCurrentPageLink = pageLink3.className.split(' ').filter(Boolean);

  // Determine the range of pages to display
  const totalPages = paginatedPosts.length;

  // Helper function to update pagination links
  const updatePaginationLink = (pageLink: Element, index: number, isCurrentPage: boolean): void => {
    pageLink.className = '';
    const classNames = isCurrentPage ? classesCurrentPageLink : classesNormalPageLink;
    pageLink.classList.add(...classNames);

    // Build the href based on whether it's a tag page or blog page
    let href: string;
    if (tag) {
      // Tag pages: /blog/tags/tag-name.html or /blog/tags/tag-name-page-2.html
      if (index === 0) {
        href = getWebPath(`${tagWithDash}.html`, `/blog/tags/${tagWithDash}.html`);
      } else {
        href = getWebPath(
          `${tagWithDash}-page-${index + 1}.html`,
          `/blog/tags/${tagWithDash}-page-${index + 1}.html`,
        );
      }
    } else {
      // Blog pages: /blog/ or /blog/index.html or /blog/blog-page-2.html
      if (index === 0) {
        href = getWebPath('index.html', '/blog/index.html');
      } else {
        href = getWebPath(`blog-page-${index + 1}.html`, `/blog/blog-page-${index + 1}.html`);
      }
    }
    (pageLink as HTMLAnchorElement).href = href;
    pageLink.textContent = String(index + 1);
    // Set accessibility attributes
    pageLink.setAttribute('aria-label', `Go to page ${index + 1}`);
    // Set data attribute for easier styling/selection
    pageLink.setAttribute('data-page-number', String(index + 1));
    if (isCurrentPage) {
      pageLink.setAttribute('aria-current', 'page');
    } else {
      pageLink.removeAttribute('aria-current');
    }
    // Show page link only if there are multiple pages
    if (totalPages > 1) {
      pageLink.classList.remove('hidden');
    }
  };
  const startPage = Math.max(
    0,
    Math.min(
      totalPages - (config as { paginationWindowSize: number }).paginationWindowSize,
      pageIndex - 2,
    ),
  );
  const endPage = Math.min(
    totalPages,
    startPage + (config as { paginationWindowSize: number }).paginationWindowSize,
  );

  // Update the pagination links
  for (let i = startPage; i < endPage; i++) {
    const pageLink = paginationDiv.querySelector(`#page-link-${i - startPage + 1}`);
    if (!pageLink) {
      throw new Error(
        `Pagination template must contain element with id "page-link-${i - startPage + 1}"`,
      );
    }
    const isActivePage = i === pageIndex; // Determine if the current page is the active page
    updatePaginationLink(pageLink, i, isActivePage); // Update the pagination link with the appropriate details
  }

  // Next page link
  nextLink.classList.toggle('hidden', pageIndex >= paginatedPosts.length - 1);
  if (!nextLink.classList.contains('hidden')) {
    const nextFileName = tag
      ? `${tagWithDash}-page-${pageIndex + 2}.html`
      : `blog-page-${pageIndex + 2}.html`;
    const nextFallback = tag
      ? `/blog/tags/${tagWithDash}-page-${pageIndex + 2}.html`
      : `/blog/blog-page-${pageIndex + 2}.html`;
    nextLink.href = getWebPath(nextFileName, nextFallback);
    nextLink.setAttribute('aria-label', 'Next page');
  }

  // Previous page link
  previousLink.classList.toggle('hidden', pageIndex <= 0);
  if (!previousLink.classList.contains('hidden')) {
    let prevFileName: string;
    let prevFallback: string;
    if (tag) {
      if (pageIndex === 1) {
        prevFileName = `${tagWithDash}.html`;
        prevFallback = `/blog/tags/${tagWithDash}.html`;
      } else {
        prevFileName = `${tagWithDash}-page-${pageIndex}.html`;
        prevFallback = `/blog/tags/${tagWithDash}-page-${pageIndex}.html`;
      }
    } else {
      if (pageIndex === 1) {
        prevFileName = 'index.html';
        prevFallback = '/blog/index.html';
      } else {
        prevFileName = `blog-page-${pageIndex}.html`;
        prevFallback = `/blog/blog-page-${pageIndex}.html`;
      }
    }
    previousLink.href = getWebPath(prevFileName, prevFallback);
    previousLink.setAttribute('aria-label', 'Previous page');
  }
};
