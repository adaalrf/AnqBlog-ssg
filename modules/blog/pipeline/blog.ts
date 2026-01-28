import path from 'path';
import { JSDOM } from 'jsdom';
import config from '../../../core/config/config.js';
import { paginatePosts, createPostItem, updatePaginationLinks } from '../utils/pagination-utils.js';
import { getListingTemplatePath, getCachedTemplate } from '../utils/template-utils.js';
import { generateFrontMatter } from '../utils/content-utils.js';
import {
  ensureDirectoryExists,
  writeFileContent,
} from '../../../core/shared/path-and-file-utils.js';
import { logger } from '../../../core/shared/logger.js';

import type { Post } from '../types.js';

/**
 * Generates paginated blog HTML files.
 * @param posts - The array of posts to paginate.
 * @param postsPerPage - The number of posts per page.
 * @param templateBlogPath - The path to the blog template.
 * @param tempBlogOutputPath - The directory to save the paginated blog pages.
 * @throws {Error} If template is missing required elements or file writing fails.
 */
export const generatePaginatedBlogHtmlFiles = async (
  posts: Post[],
  postsPerPage: number,
  templateBlogPath: string,
  tempBlogOutputPath: string,
): Promise<void> => {
  ensureDirectoryExists(tempBlogOutputPath);

  const blogContent = paginatePosts(posts, postsPerPage);

  // Ensure at least one page exists (even if empty)
  if (blogContent.length === 0) {
    blogContent.push([]);
  }

  const totalPages = blogContent.length;
  logger.info('blog.ts', `Generating ${totalPages} blog page${totalPages !== 1 ? 's' : ''}...`);

  // Read the shared listing template (with caching)
  const listingTemplatePath = String(getListingTemplatePath());
  let blogTemplateContent = String(await getCachedTemplate(listingTemplatePath));
  // Replace containerId placeholder with 'blog'
  blogTemplateContent = blogTemplateContent.replace(/\{\{containerId\}\}/g, 'blog');

  // Generate each paginated page
  for (let pageIndex = 0; pageIndex < blogContent.length; pageIndex++) {
    const pagePosts = blogContent[pageIndex];
    // Create a fresh DOM instance for each page
    const dom = new JSDOM(blogTemplateContent);
    const document = dom.window.document;
    const postItemTemplate = document.querySelector('[data-hook="post-item-template"]');
    const postLinksDiv = document.querySelector('[data-hook="post-links"]');

    if (!postItemTemplate) {
      throw new Error(
        `Blog template missing required element:\n` +
          `  Element: [data-hook="post-item-template"]\n` +
          `  Template: ${templateBlogPath}\n` +
          `  Listing template: ${listingTemplatePath}\n` +
          `  Page: ${pageIndex + 1}`,
      );
    }
    if (!postLinksDiv) {
      throw new Error(
        `Blog template missing required element:\n` +
          `  Element: [data-hook="post-links"]\n` +
          `  Template: ${templateBlogPath}\n` +
          `  Listing template: ${listingTemplatePath}\n` +
          `  Page: ${pageIndex + 1}`,
      );
    }

    // Add only posts for the current page
    pagePosts.forEach((post) => {
      const postItem = createPostItem(post, postItemTemplate, '/blog/posts', '/blog/tags');
      postLinksDiv.appendChild(postItem);
    });

    postItemTemplate.remove();

    updatePaginationLinks(
      document,
      pageIndex,
      blogContent,
      '',
      config.publicBlogOutputPath,
      config.publicContentOutputDirectory,
    );
    const blogElement = document.querySelector('[data-container-id="blog"]');
    if (!blogElement) {
      throw new Error(
        `Blog template missing required element:\n` +
          `  Element: [data-container-id="blog"]\n` +
          `  Template: ${templateBlogPath}\n` +
          `  Listing template: ${listingTemplatePath}\n` +
          `  Page: ${pageIndex + 1}`,
      );
    }
    const content = blogElement.outerHTML;
    const outputFilePath =
      pageIndex === 0
        ? path.join(tempBlogOutputPath, `index.html`)
        : path.join(tempBlogOutputPath, `blog-page-${pageIndex + 1}.html`);

    const modifiedPathBar = `/ <em>Blog</em>`.replace(/\s+/g, ' ').trim();
    // Add dynamic front matter to the content
    const finalHtml = `${generateFrontMatter(
      {
        page: modifiedPathBar,
        title: 'Blog',
      },
      {},
    )}\n${content}`;

    try {
      await writeFileContent(outputFilePath, finalHtml);
      const current = pageIndex + 1;
      logger.info('blog.ts', `[${current}/${totalPages}] Generated blog page -> ${outputFilePath}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('blog.ts', `Failed to write blog page ${pageIndex + 1}: ${err.message}`);
      throw new Error(`Failed to write blog page to ${outputFilePath}: ${err.message}`);
    }
  }

  logger.info(
    'blog.ts',
    `✓ Completed generating ${totalPages} blog page${totalPages !== 1 ? 's' : ''}`,
  );
};
