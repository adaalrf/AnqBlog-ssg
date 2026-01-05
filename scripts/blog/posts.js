import path from 'path';
import { JSDOM } from 'jsdom';
import {
  generateFrontMatter,
  truncateText,
  injectContentIntoTemplate,
  normalizeTagForFile,
  denormalizeTagFromFile,
  escapeHtml,
} from '../utils/content-utils.js';
import {
  ensureDirectoryExists,
  writeFileContent,
  readFileContent,
  sanitizeFilename,
} from '../utils/path-and-file-utils.js';
import { formatDate, formatDateISO } from '../utils/date-utils.js';
import config from '../config.js';

/**
 * Generates intermediate post HTML files.
 * @param {Array} posts - The array of posts.
 * @param {string} postTemplatePath - The path to the post template.
 * @param {string} tempPostsOutputDirectory - The directory to save the generated files.
 */
export const generateIntermediatePostHtmlFiles = async (
  posts,
  postTemplatePath,
  tempPostsOutputDirectory,
) => {
  ensureDirectoryExists(tempPostsOutputDirectory);

  const totalPosts = posts.length;
  console.log(`(Posts.js): Processing ${totalPosts} post${totalPosts !== 1 ? 's' : ''}...`);

  // Read template once to avoid redundant file reads
  const templateContent = readFileContent(postTemplatePath);

  // Process posts in parallel for better performance
  await Promise.all(posts.map(async (post, index) => {

    // Format tags for display (escape to prevent XSS)
    const tagsHtml = post.tags && post.tags.length > 0
      ? post.tags
        .map(
          (tag) =>
            `<a href="/blog/tags/${normalizeTagForFile(tag)}.html">${escapeHtml(denormalizeTagFromFile(tag))}</a>`,
        )
        .join(' ')
      : '';

    // Replace placeholders directly (no title, just date, tags, and content)
    const dom = new JSDOM(templateContent);
    const document = dom.window.document;

    // Replace placeholders
    let bodyHtml = document.body.innerHTML
      .replace(/\{\{date\}\}/g, formatDate(post.date))
      .replace(/\{\{tags\}\}/g, tagsHtml)
      .replace(/\{\{content\}\}/g, post.content);

    document.body.innerHTML = bodyHtml;
    
    // Update time element with ISO date attribute
    const dateElement = document.querySelector('.post-date');
    if (dateElement && dateElement.tagName.toLowerCase() === 'time') {
      dateElement.setAttribute('datetime', formatDateISO(post.date));
    }

    // Remove tag divider if no tags
    if (!tagsHtml) {
      const tagDivider = document.querySelector('#tag-divider');
      if (tagDivider) tagDivider.remove();
    }

    const postContentElement = document.querySelector('#post-content');
    if (!postContentElement) {
      throw new Error(`Post template must contain an element with id "post-content" (template: ${postTemplatePath}, post: ${post.htmlFileName || 'unknown'})`);
    }
    const htmlContent = postContentElement.outerHTML;

    // Sanitize filename: remove/replace invalid characters
    const sanitizedFileName = sanitizeFilename(post.htmlFileName);
    const outputPath = path.join(tempPostsOutputDirectory, sanitizedFileName);

    // Use plain text truncation for breadcrumb (escape to prevent XSS)
    const truncatedTitle = truncateText(post.title || 'Untitled', config.titleTruncationLengthBreadcrumb);
    const escapedTruncatedTitle = escapeHtml(truncatedTitle);
    const modifiedPathBar = `/ <a href="/blog">Blog</a> / <em>${escapedTruncatedTitle}</em>`.replace(/\s+/g, ' ').trim();
    // Add dynamic front matter to the content
    const finalHtml = `${generateFrontMatter(post, {
      page: modifiedPathBar,
    })}\n${htmlContent}`;

    writeFileContent(outputPath, finalHtml);
    const current = index + 1;
    console.log(`(Posts.js): [${current}/${totalPosts}] Generated post -> ${outputPath}`);
  }));

  console.log(`(Posts.js): ✓ Completed processing ${totalPosts} post${totalPosts !== 1 ? 's' : ''}`);
};
