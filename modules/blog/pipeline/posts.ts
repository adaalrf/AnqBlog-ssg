import path from 'path';
import { JSDOM } from 'jsdom';
import config from '../../../core/config/config.js';
import {
  generateFrontMatter,
  truncateText,
  denormalizeTagFromFile,
  escapeHtml,
  getTagSlug,
} from '../utils/content-utils.js';
import {
  ensureDirectoryExists,
  writeFileContent,
  sanitizeFilename,
} from '../../../core/shared/path-and-file-utils.js';
import { formatDate, formatDateISO } from '../../../core/shared/date-utils.js';
import { logger } from '../../../core/shared/logger.js';
import { getCachedTemplate } from '../utils/template-utils.js';

import type { Post } from '../types.js';

/**
 * Generates intermediate post HTML files.
 * @param posts - The array of posts.
 * @param postTemplatePath - The path to the post template.
 * @param tempPostsOutputDirectory - The directory to save the generated files.
 * @throws {Error} If template is missing required elements or file writing fails.
 */
export const generateIntermediatePostHtmlFiles = async (
  posts: Post[],
  postTemplatePath: string,
  tempPostsOutputDirectory: string,
): Promise<void> => {
  ensureDirectoryExists(tempPostsOutputDirectory);

  const totalPosts = posts.length;
  logger.info('posts.ts', `Processing ${totalPosts} post${totalPosts !== 1 ? 's' : ''}...`);

  // Read template once with caching
  const templateContent = String(await getCachedTemplate(postTemplatePath));

  // Process posts in parallel for better performance
  await Promise.all(
    posts.map(async (post, index) => {
      // Format tags for display (escape to prevent XSS)
      const tagsHtml =
        post.tags && post.tags.length > 0
          ? post.tags
              .map(
                (tag) =>
                  `<a href="/blog/tags/${getTagSlug(tag)}.html">${escapeHtml(denormalizeTagFromFile(tag))}</a>`,
              )
              .join(' ')
          : '';

      // Replace placeholders directly (no title, just date, tags, and content)
      const dom = new JSDOM(templateContent);
      const document = dom.window.document;

      // Replace placeholders
      const bodyHtml = document.body.innerHTML
        .replace(/\{\{date\}\}/g, formatDate(post.date))
        .replace(/\{\{tags\}\}/g, tagsHtml)
        .replace(/\{\{content\}\}/g, post.content);

      document.body.innerHTML = bodyHtml;

      // Update time element with ISO date attribute
      const dateElement = document.querySelector('[data-hook="post-date"]');
      if (dateElement && dateElement.tagName.toLowerCase() === 'time') {
        dateElement.setAttribute('datetime', formatDateISO(post.date));
      }

      // Remove tag divider if no tags
      if (!tagsHtml) {
        const tagDivider = document.querySelector('[data-hook="tag-divider"]');
        if (tagDivider) tagDivider.remove();
      }

      const postContentElement = document.querySelector('[data-hook="post-content"]');
      if (!postContentElement) {
        throw new Error(
          `Post template missing required element:\n` +
            `  Element: [data-hook="post-content"]\n` +
            `  Template: ${postTemplatePath}\n` +
            `  Post: ${post.htmlFileName || 'unknown'}\n` +
            `  Title: ${post.title || 'Untitled'}`,
        );
      }
      const htmlContent = postContentElement.outerHTML;

      // Sanitize filename: remove/replace invalid characters
      const sanitizedFileName = sanitizeFilename(post.htmlFileName);
      const outputPath = path.join(tempPostsOutputDirectory, sanitizedFileName);

      // Use plain text truncation for breadcrumb (escape to prevent XSS)
      const truncatedTitle = truncateText(
        post.title || 'Untitled',
        config.titleTruncationLengthBreadcrumb,
      );
      const escapedTruncatedTitle = escapeHtml(truncatedTitle);
      const modifiedPathBar = `/ <a href="/blog">Blog</a> / <em>${escapedTruncatedTitle}</em>`
        .replace(/\s+/g, ' ')
        .trim();
      // Add dynamic front matter to the content
      const finalHtml = `${generateFrontMatter(post as Record<string, unknown>, {
        page: modifiedPathBar,
      })}\n${htmlContent}`;

      await writeFileContent(outputPath, finalHtml);
      const current = index + 1;
      logger.info('posts.ts', `[${current}/${totalPosts}] Generated post -> ${outputPath}`);
    }),
  );

  logger.info(
    'posts.ts',
    `✓ Completed processing ${totalPosts} post${totalPosts !== 1 ? 's' : ''}`,
  );
};
