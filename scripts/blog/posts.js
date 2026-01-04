import path from 'path';
import { JSDOM } from 'jsdom';
import {
  generateFrontMatter,
  truncateText,
  injectContentIntoTemplate,
  normalizeTagForFile,
  denormalizeTagFromFile,
} from '../utils/content-utils.js';
import {
  ensureDirectoryExists,
  writeFileContent,
  readFileContent,
} from '../utils/path-and-file-utils.js';
import { formatDate } from '../utils/date-utils.js';

/**
 * Generates intermediate post HTML files.
 * @param {Array} posts - The array of posts.
 * @param {string} postTemplatePath - The path to the post template.
 * @param {string} tempPostsOutputDirectory - The directory to save the generated files.
 */
export const generateIntermediatePostHtmlFiles = (
  posts,
  postTemplatePath,
  tempPostsOutputDirectory,
) => {
  ensureDirectoryExists(tempPostsOutputDirectory);

  posts.forEach((post) => {
    const templateContent = readFileContent(postTemplatePath);
    
    // Format tags for display
    const tagsHtml = post.tags && post.tags.length > 0
      ? post.tags
          .map(
            (tag) =>
              `<a href="/blog/tags/${normalizeTagForFile(tag)}.html">${denormalizeTagFromFile(tag)}</a>`,
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
    
    // Remove tag divider if no tags
    if (!tagsHtml) {
      const tagDivider = document.querySelector('#tag-divider');
      if (tagDivider) tagDivider.remove();
    }
    
    const postContentElement = document.querySelector('#post-content');
    if (!postContentElement) {
      throw new Error('Post template must contain an element with id "post-content"');
    }
    const htmlContent = postContentElement.outerHTML;
    
    // Sanitize filename: remove/replace invalid characters
    const sanitizedFileName = post.htmlFileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-') // Remove invalid filesystem characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
    
    const outputPath = path.join(tempPostsOutputDirectory, sanitizedFileName);

    // Use plain text truncation for breadcrumb (no HTML, no newlines)
    const truncatedTitle = truncateText(post.title || 'Untitled', 20);
    const modifiedPathBar = `/ <a href=/blog>Blog</a> / <em>${truncatedTitle}</em>`.replace(/\s+/g, ' ').trim();
    // Add dynamic front matter to the content
    const finalHtml = `${generateFrontMatter(post, {
      page: modifiedPathBar,
    })}\n${htmlContent}`;

    writeFileContent(outputPath, finalHtml);
    console.log(`(Posts.js): Generated post -> ${outputPath}`);
  });
};
