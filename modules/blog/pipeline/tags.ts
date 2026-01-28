import path from 'path';
import { JSDOM } from 'jsdom';
import config from '../../../core/config/config.js';
import { paginatePosts, createPostItem, updatePaginationLinks } from '../utils/pagination-utils.js';
import {
  generateFrontMatter,
  denormalizeTagFromFile,
  escapeHtml,
  getTagSlug,
} from '../utils/content-utils.js';
import {
  ensureDirectoryExists,
  writeFileContent,
} from '../../../core/shared/path-and-file-utils.js';
import { logger } from '../../../core/shared/logger.js';
import { getListingTemplatePath, getCachedTemplate } from '../utils/template-utils.js';

import type { Post, Tags } from '../types.js';

/**
 * Tag link information for the tags index page.
 */
interface TagLink {
  tag: string;
  link: string;
  count: number;
}

/**
 * Generates tag pages for the blog.
 * @param tags - The tags with associated posts.
 * @param posts - The array of posts.
 * @param postsPerPage - The number of posts per page.
 * @param templateMainTagsPath - The path to the main tags index template.
 * @param tempTagsOutputDirectory - The directory to save the paginated tag pages.
 * @throws {Error} If template is missing required elements or file writing fails.
 */
export const generateTagPages = async (
  tags: Tags,
  posts: Post[],
  postsPerPage: number,
  templateMainTagsPath: string,
  tempTagsOutputDirectory: string,
): Promise<void> => {
  ensureDirectoryExists(tempTagsOutputDirectory); // Ensure the directory exists

  // Read the shared listing template (with caching)
  const listingTemplatePath = String(getListingTemplatePath());
  let templateTagsContent = String(await getCachedTemplate(listingTemplatePath));
  // Replace containerId placeholder with 'tag'
  templateTagsContent = templateTagsContent.replace(/\{\{containerId\}\}/g, 'tag');

  // Create an array to store tag link information for the index page
  const tagLinks: TagLink[] = [];
  const tagKeys = Object.keys(tags);
  const totalTags = tagKeys.length;
  let totalTagPages = 0;

  // Count total pages for progress tracking
  tagKeys.forEach((tag) => {
    const tagPosts = posts.filter(
      (post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag),
    );
    const tagContent = paginatePosts(tagPosts, postsPerPage);
    totalTagPages += tagContent.length;
  });

  logger.info(
    'tags.ts',
    `Processing ${totalTags} tag${totalTags !== 1 ? 's' : ''} (${totalTagPages} page${totalTagPages !== 1 ? 's' : ''})...`,
  );

  let currentPage = 0;
  for (const tag of Object.keys(tags)) {
    const tagPosts = posts.filter(
      (post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag),
    );
    const tagContent = paginatePosts(tagPosts, postsPerPage);

    for (let pageIndex = 0; pageIndex < tagContent.length; pageIndex++) {
      const pagePosts = tagContent[pageIndex];
      // Create a new JSDOM instance from cached template for each page
      const dom = new JSDOM(templateTagsContent);
      const document = dom.window.document;
      const postItemTemplate = document.querySelector('[data-hook="post-item-template"]');
      const postLinksDiv = document.querySelector('[data-hook="post-links"]');

      if (!postItemTemplate) {
        throw new Error(
          `Tags template missing required element:\n` +
            `  Element: [data-hook="post-item-template"]\n` +
            `  Listing template: ${listingTemplatePath}\n` +
            `  Tag: ${tag}\n` +
            `  Page: ${pageIndex + 1}`,
        );
      }
      if (!postLinksDiv) {
        throw new Error(
          `Tags template missing required element:\n` +
            `  Element: [data-hook="post-links"]\n` +
            `  Listing template: ${listingTemplatePath}\n` +
            `  Tag: ${tag}\n` +
            `  Page: ${pageIndex + 1}`,
        );
      }

      // Add each post to the post links container
      pagePosts.forEach((post) => {
        const postItem = createPostItem(post, postItemTemplate, '/blog/posts', '/blog/tags');
        postLinksDiv.appendChild(postItem);
      });

      postItemTemplate.remove();
      updatePaginationLinks(
        document,
        pageIndex,
        tagContent,
        tag,
        config.publicTagsOutputDirectory,
        config.publicContentOutputDirectory,
      );

      // Save the tag page
      const tagElement = document.querySelector('[data-container-id="tag"]');
      if (!tagElement) {
        throw new Error(
          `Tags template missing required element:\n` +
            `  Element: [data-container-id="tag"]\n` +
            `  Listing template: ${listingTemplatePath}\n` +
            `  Tag: ${tag}\n` +
            `  Page: ${pageIndex + 1}`,
        );
      }
      const content = tagElement.outerHTML;
      // Sanitize tag for filename
      const filesWithDash = getTagSlug(tag);

      const outputFilePath =
        pageIndex === 0
          ? path.join(tempTagsOutputDirectory, `${filesWithDash}.html`)
          : path.join(tempTagsOutputDirectory, `${filesWithDash}-page-${pageIndex + 1}.html`);
      const filesWithoutDash = denormalizeTagFromFile(tag);
      // Escape tag name in breadcrumb to prevent XSS
      const escapedTagName = escapeHtml(filesWithoutDash);
      const modifiedPathBar = `/ <a href="/blog/tags">Tags</a> / <em>${escapedTagName}</em>`
        .replace(/\s+/g, ' ')
        .trim();
      // Add dynamic front matter to the content
      const finalHtml = `${generateFrontMatter(
        {
          page: modifiedPathBar,
          title: filesWithoutDash,
        },
        {},
      )}\n${content}`;

      await writeFileContent(outputFilePath, finalHtml);
      currentPage++;
      logger.info(
        'tags.ts',
        `[${currentPage}/${totalTagPages}] Generated tag page -> ${outputFilePath}`,
      );

      // Add the link to the tagLinks array for the index page
      if (pageIndex === 0) {
        tagLinks.push({
          tag: filesWithoutDash,
          link: `/blog/tags/${filesWithDash}.html`,
          count: tagPosts.length,
        });
      }
    }
  }

  // Generate the index.html page with links to all tags using a template (with caching)
  const indexTemplateContent = String(await getCachedTemplate(templateMainTagsPath));
  const dom = new JSDOM(indexTemplateContent);
  const document = dom.window.document;
  const tagLinksContainer = document.querySelector('[data-hook="tag-links"]');

  if (!tagLinksContainer) {
    throw new Error(
      `Tags index template missing required element:\n` +
        `  Element: [data-hook="tag-links"]\n` +
        `  Template: ${templateMainTagsPath}`,
    );
  }

  const tagLinkLiTemplate = document.querySelector('[data-hook="tag-link-item-template"]');
  const tagLinkAnchorTemplate = document.querySelector('[data-hook="tag-link-template"]');

  let linkElementLiClasses: string[] = [];
  let linkElementAnchorClasses: string[] = [];

  // Read anchor classes first (before removing the li template)
  if (tagLinkAnchorTemplate) {
    linkElementAnchorClasses = tagLinkAnchorTemplate.className.split(' ').filter(Boolean);
  }

  if (tagLinkLiTemplate) {
    linkElementLiClasses = tagLinkLiTemplate.className
      .split(' ')
      .filter(Boolean)
      .filter((cls) => cls !== 'hidden'); // Filter out 'hidden' class
    tagLinkLiTemplate.remove(); // This also removes the anchor inside it
  }

  // Sort tags by count (descending), then alphabetically
  tagLinks.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.tag.localeCompare(b.tag);
  });

  tagLinks.forEach((tagLink) => {
    if (!tagLink.link || !tagLink.tag) {
      logger.error('tags.ts', `Invalid tagLink: ${JSON.stringify(tagLink)}`);
      return;
    }
    const linkElement = document.createElement('a');
    linkElement.href = tagLink.link;
    linkElement.textContent = tagLink.tag;
    if (linkElementAnchorClasses.length) {
      linkElement.classList.add(...linkElementAnchorClasses);
    }

    // Add post count
    const countSpan = document.createElement('span');
    countSpan.className = 'tag-count';
    countSpan.textContent = ` (${tagLink.count})`;
    countSpan.setAttribute('aria-label', `${tagLink.count} post${tagLink.count !== 1 ? 's' : ''}`);
    linkElement.appendChild(countSpan);

    const listItem = document.createElement('li');
    listItem.appendChild(linkElement);
    if (linkElementLiClasses.length) {
      listItem.classList.add(...linkElementLiClasses);
    }
    tagLinksContainer.appendChild(listItem);
  });

  const tagsElement = document.querySelector('[data-hook="tags-root"]');
  if (!tagsElement) {
    throw new Error('Tags index template missing required element: [data-hook="tags-root"]');
  }
  const content = tagsElement.outerHTML;
  const mainTagsPath = path.join(tempTagsOutputDirectory, 'index.html');
  const modifiedPathBar = `/ <em>Tags</em>`.replace(/\s+/g, ' ').trim();
  // Add dynamic front matter to the content
  const finalIndexHtml = `${generateFrontMatter(
    {
      page: modifiedPathBar,
      title: 'Tags',
    },
    {},
  )}\n${content}`;

  await writeFileContent(mainTagsPath, finalIndexHtml);
  logger.info('tags.ts', `Generated main tags page -> ${mainTagsPath}`);
  logger.info(
    'tags.ts',
    `✓ Completed processing ${totalTags} tag${totalTags !== 1 ? 's' : ''} (${totalTagPages} page${totalTagPages !== 1 ? 's' : ''})`,
  );
};
