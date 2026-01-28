import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import truncate from 'html-truncate';
import fsPromises from 'fs/promises';
import path from 'path';
import { readFileContent, sanitizeFilename } from '../../../core/shared/path-and-file-utils.js';
import { logger } from '../../../core/shared/logger.js';
import type { ProcessMarkdownOptions, ParsedFrontMatter, ParsedMarkdown, Post } from '../types.js';

/**
 * Constants for content processing
 */
const NO_PREVIEW_LIMIT = Number.POSITIVE_INFINITY;
const DEFAULT_PREVIEW_LENGTH = 250;
const DEFAULT_MAX_MARKDOWN_FILE_SIZE = 5 * 1024 * 1024; // 5MB default limit

/**
 * Normalizes a tag for use in filenames (replaces spaces with dashes).
 * @param tag - The tag to normalize.
 * @returns The normalized tag for filenames.
 * @throws {Error} If tag is not a string.
 */
export const normalizeTagForFile = (tag: string): string => {
  if (typeof tag !== 'string') {
    throw new Error('Tag must be a string');
  }
  return tag.split(' ').join('-');
};

/**
 * Converts a tag into a filesystem-safe slug and lowercases it.
 * Falls back to a sanitized raw tag or 'tag' when normalization produces an empty string.
 * @param tag - The tag value
 */
export const getTagSlug = (tag: string): string => {
  const normalized = normalizeTagForFile(tag);
  const slugified = sanitizeFilename(normalized)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slugified) {
    return slugified;
  }
  const fallback = sanitizeFilename(tag)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return fallback || 'tag';
};

/**
 * Denormalizes a tag from a filename (replaces dashes with spaces).
 * @param tag - The tag to denormalize.
 * @returns The denormalized tag for display.
 * @throws {Error} If tag is not a string.
 */
export const denormalizeTagFromFile = (tag: string): string => {
  if (typeof tag !== 'string') {
    throw new Error('Tag must be a string');
  }
  return tag.split('-').join(' ');
};

/**
 * Gets the first N characters of HTML content while preserving structure.
 * For previews, removes headings and shows only paragraphs.
 * @param htmlContent - The HTML content.
 * @param length - The number of characters to truncate to.
 * @returns The truncated HTML content.
 * @throws {Error} If htmlContent is not a string or length is invalid.
 */
export const getFirstNthCharacters = (
  htmlContent: string,
  length: number = DEFAULT_PREVIEW_LENGTH,
): string => {
  if (typeof htmlContent !== 'string') {
    throw new Error('HTML content must be a string');
  }
  if (typeof length !== 'number' || length < 0) {
    throw new Error('Length must be a non-negative number');
  }

  // For previews, remove headings to avoid showing partial headings
  if (length < NO_PREVIEW_LIMIT) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Remove all headings (h1-h6) from preview
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading: Element) => {
      heading.remove();
    });

    // Get only the first paragraph for a clean preview (avoid code blocks and complex content)
    const paragraphs = Array.from(document.querySelectorAll('p')) as Element[];

    if (paragraphs.length > 0) {
      // Take only the first paragraph for a clean, simple preview
      const firstParagraph = paragraphs[0] as HTMLElement;
      const pText = firstParagraph.textContent || '';

      // If first paragraph is short enough, use it as-is
      if (pText.length <= length) {
        const previewHtml = firstParagraph.outerHTML.replace(/>\s+</g, '><').trim();
        return previewHtml;
      } else {
        // Truncate if too long
        const truncated = truncate(firstParagraph.outerHTML, length, { ellipsis: '...' });
        return truncated.replace(/>\s+</g, '><').trim();
      }
    }

    htmlContent = document.body.innerHTML;
  }

  return truncate(htmlContent, length, { ellipsis: '...' });
};

/**
 * Injects content into a template.
 * @param templateContent - The template content.
 * @param data - The data to inject.
 * @returns The DOM object with injected content.
 * @throws {Error} If templateContent is not a string or data is not an object.
 */
export const injectContentIntoTemplate = (
  templateContent: string,
  data: Record<string, unknown>,
): JSDOM => {
  if (typeof templateContent !== 'string') {
    throw new Error('Template content must be a string');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Data must be an object');
  }
  const tagWrapper = (tag: string) => `<a href="#">${tag}</a>`;
  const tagsContainerSelector = '[data-hook="tags"]';
  const tagDividerSelector = '[data-hook="tag-divider"]';

  const dom = new JSDOM(templateContent);
  const document = dom.window.document;

  // Replace placeholders
  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`{{{${key}}}}`, 'g');
    const value = data[key];
    document.body.innerHTML = document.body.innerHTML.replace(placeholder, String(value));
  });

  // Handle tags
  const tagsContainer = document.querySelector(tagsContainerSelector);
  const tagDivider = document.querySelector(tagDividerSelector);
  if (tagsContainer) {
    const tags = data.tags as string[] | undefined;
    if (tags && tags.length > 0) {
      const tagsList = tags.map(tagWrapper).join(' ');
      tagsContainer.innerHTML = tagsList;
    } else {
      tagsContainer.remove();
      if (tagDivider) tagDivider.remove();
    }
  }

  return dom;
};

/**
 * Parses front matter from HTML files.
 * @param fileContent - The HTML file content.
 * @returns The parsed data and HTML content.
 */
export const parseHtmlFrontMatter = (fileContent: string): ParsedFrontMatter => {
  if (typeof fileContent !== 'string') {
    throw new Error('File content must be a string');
  }
  try {
    const { data, content } = matter(fileContent);
    return { data: data || {}, content: content || '' };
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to parse front matter: ${err.message}`);
  }
};

/**
 * Cleans up excessive whitespace in HTML content.
 * Preserves whitespace in preformatted elements (pre, code, textarea).
 *
 * Note: This function processes the HTML string directly and may affect
 * intentional whitespace in some edge cases (e.g., inline code spans,
 * custom HTML structures). The function is designed to work with standard
 * Markdown-generated HTML from the marked library.
 *
 * @param html - The HTML content.
 * @returns The cleaned HTML content.
 */
const cleanHtmlWhitespace = (html: string): string => {
  if (typeof html !== 'string') {
    return html;
  }

  return (
    html
      // Remove excessive newlines (more than 2 consecutive)
      .replace(/\n{3,}/g, '\n\n')
      // Remove whitespace between HTML tags (but preserve in pre/code/textarea)
      // This regex matches > followed by whitespace followed by <
      // Note: This may affect intentional spacing in some edge cases
      .replace(/>\s+</g, '><')
      // Collapse multiple spaces/tabs to single space (but be careful with preformatted)
      // Note: This is applied globally; pre/code/textarea content is handled by marked
      .replace(/[ \t]+/g, ' ')
      // Trim each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Remove leading/trailing whitespace
      .trim()
  );
};

/**
 * Sanitizes generated HTML by stripping dangerous elements/attributes while leaving code-related tags intact.
 * Removes <script>/<style> tags and attributes that start with "on" or point to javascript: URLs.
 */
export const sanitizeGeneratedHtml = (html: string): string => {
  if (typeof html !== 'string') {
    return html;
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll('script,style').forEach((element) => element.remove());

  const elements = document.body ? Array.from(document.body.querySelectorAll('*')) : [];
  elements.forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      if (attrName.startsWith('on')) {
        element.removeAttribute(attr.name);
        return;
      }
      const attrValue = (attr.value || '').trim().toLowerCase();
      if (
        (attrName === 'href' || attrName === 'src') &&
        (attrValue.startsWith('javascript:') || attrValue.startsWith('data:text/html'))
      ) {
        element.removeAttribute(attr.name);
      }
    });
  });

  return document.body ? document.body.innerHTML : '';
};

/**
 * Parses and converts markdown to HTML.
 * @param fileContent - The markdown file content.
 * @returns The parsed data and HTML content.
 */
export const parseMarkdown = (fileContent: string): ParsedMarkdown => {
  if (typeof fileContent !== 'string') {
    throw new Error('File content must be a string');
  }
  try {
    const { data, content } = matter(fileContent);
    let htmlContent = marked(content || '') as string;
    // Clean up whitespace
    htmlContent = cleanHtmlWhitespace(htmlContent);
    // Sanitize the generated HTML while preserving code blocks
    htmlContent = sanitizeGeneratedHtml(htmlContent);
    return { data: data || {}, htmlContent };
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to parse markdown: ${err.message}`);
  }
};

/**
 * Processes a single markdown file.
 * @param file - The filename.
 * @param directory - The directory containing the file.
 * @param previewLength - The preview length limit.
 * @param maxFileSize - Maximum file size in bytes.
 * @param seenFilenames - Set of already seen filenames to detect duplicates.
 * @returns Processed post or null if skipped.
 */
const processSingleMarkdownFile = async (
  file: string,
  directory: string,
  previewLength: number,
  maxFileSize: number,
  seenFilenames: Set<string>,
): Promise<Partial<Post> | null> => {
  const filePath = path.join(directory, file);

  // Check file size before processing
  try {
    const stats = await fsPromises.stat(filePath);
    if (stats.size > maxFileSize) {
      logger.warn(
        'Content-utils.ts',
        `File ${file} exceeds size limit (${(stats.size / 1024 / 1024).toFixed(2)}MB > ${maxFileSize / 1024 / 1024}MB), skipping.`,
      );
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      'Content-utils.ts',
      `Could not check file size for ${file}: ${errorMessage}. Skipping.`,
    );
    return null;
  }

  const fileContent = await readFileContent(filePath);
  const { data, htmlContent } = parseMarkdown(fileContent);

  // For preview content, remove the first H1 to avoid duplicate titles
  let previewHtml = htmlContent;
  if (previewLength < NO_PREVIEW_LIMIT) {
    const previewDom = new JSDOM(htmlContent);
    const previewDoc = previewDom.window.document;
    const firstH1 = previewDoc.querySelector('h1');
    if (firstH1) {
      firstH1.remove();
      previewHtml = previewDoc.body.innerHTML;
    }
  }

  const rawHtmlFileName = file.replace('.md', '.html');
  const htmlFileName = sanitizeFilename(rawHtmlFileName);

  // Note: Duplicate checking is done upfront before parallel processing.
  // We still add to seenFilenames here as a safety measure for parallel processing,
  // but we don't check since duplicates were already filtered out.
  seenFilenames.add(htmlFileName);

  return {
    ...data, // Include all front matter data
    htmlFileName,
    content: htmlContent,
    previewContent: getFirstNthCharacters(previewHtml, previewLength),
  };
};

/**
 * Processes markdown files in a directory in parallel for better performance.
 * @param directory - The directory containing markdown files.
 * @param options - Options for processing markdown files.
 * @returns An array of processed posts.
 * @throws {Error} If directory is not a string or options is not an object.
 */
export const processMarkdownFiles = async (
  directory: string,
  options: ProcessMarkdownOptions & { maxFileSize?: number } = {},
): Promise<Partial<Post>[]> => {
  if (typeof directory !== 'string') {
    throw new Error('Directory must be a string');
  }
  if (options && (typeof options !== 'object' || Array.isArray(options))) {
    throw new Error('Options must be an object');
  }

  // Return empty array if directory doesn't exist (allows graceful handling for first-time setup)
  // Log a warning to help users identify configuration issues
  try {
    await fsPromises.access(directory);
  } catch {
    logger.warn(
      'Content-utils.ts',
      `Directory does not exist: ${directory}. Returning empty array.`,
    );
    return [];
  }

  const { previewLength = NO_PREVIEW_LIMIT, maxFileSize = DEFAULT_MAX_MARKDOWN_FILE_SIZE } =
    options;
  const files = (await fsPromises.readdir(directory)).filter((file) => file.endsWith('.md'));

  if (files.length === 0) {
    return [];
  }

  // Check for duplicate filenames upfront to avoid race conditions in parallel processing
  const seenFilenames = new Set<string>();
  const duplicateFiles: string[] = [];
  const validFiles: string[] = [];

  for (const file of files) {
    const rawHtmlFileName = file.replace('.md', '.html');
    const htmlFileName = sanitizeFilename(rawHtmlFileName);
    if (seenFilenames.has(htmlFileName)) {
      duplicateFiles.push(file);
      logger.warn(
        'Content-utils.ts',
        `Duplicate output filename detected after sanitization: ${htmlFileName}. This will cause one post to overwrite another. Skipping file: ${file}`,
      );
    } else {
      seenFilenames.add(htmlFileName);
      validFiles.push(file);
    }
  }

  // Process valid files in parallel for better performance
  const postPromises = validFiles.map((file) =>
    processSingleMarkdownFile(file, directory, previewLength, maxFileSize, seenFilenames),
  );

  const results = await Promise.all(postPromises);

  // Filter out null results (skipped files)
  return results.filter((post): post is Partial<Post> => post !== null);
};

/**
 * Replaces placeholders in a template with corresponding values.
 * @param template - The template content.
 * @param values - The values to replace the placeholders with.
 * @returns The template with placeholders replaced.
 * @throws {Error} If template is not a string or values is not an object.
 */
export const replacePlaceholders = (template: string, values: Record<string, unknown>): string => {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('Values must be an object');
  }
  return template.replace(/{{(\w+)}}/g, (placeholder, key: string) => {
    const value = key in values ? values[key] : placeholder;
    // Strip newlines from page breadcrumb to prevent layout shifts
    if (key === 'page' && typeof value === 'string') {
      const cleanedValue = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return cleanedValue;
    }
    return String(value);
  });
};

/**
 * Escapes a value for use in YAML front matter.
 * @param value - The value to escape.
 * @returns The escaped value as a string.
 */
const escapeYamlValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '""';
  }
  if (typeof value !== 'string') {
    return JSON.stringify(value);
  }
  // Escape backslashes first, then quotes, then newlines
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')}"`;
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param text - The text to escape.
 * @returns The escaped text safe for HTML insertion.
 */
export const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') {
    return '';
  }
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Truncates plain text to a specified length.
 * @param text - The text to truncate.
 * @param length - The maximum length.
 * @returns The truncated text.
 */
export const truncateText = (text: string, length: number = 50): string => {
  if (typeof text !== 'string') {
    return '';
  }
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length).trim() + '...';
};

/**
 * Truncates plain text to a specified length on word boundaries.
 * @param text - The text to truncate.
 * @param length - The maximum length.
 * @returns The truncated text.
 */
export const truncateTextOnWordBoundary = (text: string, length: number = 50): string => {
  if (typeof text !== 'string') {
    return '';
  }
  if (text.length <= length) {
    return text;
  }
  // Find the last space before the length limit
  const truncated = text.substring(0, length);
  const lastSpace = truncated.lastIndexOf(' ');
  // If we found a space and it's not too close to the start, truncate there
  if (lastSpace > length * 0.5) {
    return text.substring(0, lastSpace).trim() + '...';
  }
  // Otherwise, truncate at the exact length (fallback for very long words)
  return truncated.trim() + '...';
};

/**
 * Generates front matter string from a data object and additional options.
 * @param data - The metadata object.
 * @param options - Additional options to include in the front matter.
 * @returns The front matter string.
 */
export const generateFrontMatter = (
  data: Record<string, unknown>,
  options: Record<string, unknown> = {},
): string => {
  const mergedData = { ...data, ...options };
  return `---\n${Object.entries(mergedData)
    .map(([key, value]) => `${key}: ${escapeYamlValue(value)}`)
    .join('\n')}\n---`;
};
