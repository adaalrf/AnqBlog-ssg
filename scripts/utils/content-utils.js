import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import truncate from 'html-truncate';
import fs from 'fs';
import path from 'path';
import { readFileContent } from './path-and-file-utils.js';

/**
 * Normalizes a tag for use in filenames (replaces spaces with dashes).
 * @param {string} tag - The tag to normalize.
 * @returns {string} - The normalized tag for filenames.
 * @throws {Error} - If tag is not a string.
 */
export const normalizeTagForFile = (tag) => {
  if (typeof tag !== 'string') {
    throw new Error('Tag must be a string');
  }
  return tag.split(' ').join('-');
};

/**
 * Denormalizes a tag from a filename (replaces dashes with spaces).
 * @param {string} tag - The tag to denormalize.
 * @returns {string} - The denormalized tag for display.
 * @throws {Error} - If tag is not a string.
 */
export const denormalizeTagFromFile = (tag) => {
  if (typeof tag !== 'string') {
    throw new Error('Tag must be a string');
  }
  return tag.split('-').join(' ');
};

/**
 * Gets the first N characters of HTML content while preserving structure.
 * For previews, removes headings and shows only paragraphs.
 * @param {string} htmlContent - The HTML content.
 * @param {number} length - The number of characters to truncate to.
 * @returns {string} - The truncated HTML content.
 * @throws {Error} - If htmlContent is not a string or length is invalid.
 */
export const getFirstNthCharacters = (htmlContent, length = 250) => {
  if (typeof htmlContent !== 'string') {
    throw new Error('HTML content must be a string');
  }
  if (typeof length !== 'number' || length < 0) {
    throw new Error('Length must be a non-negative number');
  }

  // For previews, remove headings to avoid showing partial headings
  if (length < Number.POSITIVE_INFINITY) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Remove all headings (h1-h6) from preview
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      heading.remove();
    });

    // Get only the first paragraph for a clean preview (avoid code blocks and complex content)
    const paragraphs = Array.from(document.querySelectorAll('p'));

    if (paragraphs.length > 0) {
      // Take only the first paragraph for a clean, simple preview
      const firstParagraph = paragraphs[0];
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
 * @param {string} templateContent - The template content.
 * @param {object} data - The data to inject.
 * @param {object} [options] - Options for injecting tags.
 * @returns {object} - The DOM object with injected content.
 * @throws {Error} - If templateContent is not a string or data is not an object.
 */
export const injectContentIntoTemplate = (
  templateContent,
  data,
  options = {},
) => {
  if (typeof templateContent !== 'string') {
    throw new Error('Template content must be a string');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Data must be an object');
  }
  const {
    tagWrapper = (tag) => `<a href="#">${tag}</a>`,
    tagsContainerSelector = '.tags',
    tagDividerSelector = '#post-tag-divider',
  } = options;

  const dom = new JSDOM(templateContent);
  const document = dom.window.document;

  // Replace placeholders
  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`{{{${key}}}}`, 'g');
    const value = data[key];
    document.body.innerHTML = document.body.innerHTML.replace(
      placeholder,
      value,
    );
  });

  // Handle tags
  const tagsContainer = document.querySelector(tagsContainerSelector);
  const tagDivider = document.querySelector(tagDividerSelector);
  if (tagsContainer) {
    if (data.tags && data.tags.length > 0) {
      const tagsList = data.tags.map(tagWrapper).join(' ');
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
 * @param {string} fileContent - The HTML file content.
 * @returns {object} - The parsed data and HTML content.
 */
export const parseHtmlFrontMatter = (fileContent) => {
  if (typeof fileContent !== 'string') {
    throw new Error('File content must be a string');
  }
  try {
    const { data, content } = matter(fileContent);
    return { data: data || {}, content: content || '' };
  } catch (error) {
    throw new Error(`Failed to parse front matter: ${error.message}`);
  }
};

/**
 * Cleans up excessive whitespace in HTML content.
 * @param {string} html - The HTML content.
 * @returns {string} - The cleaned HTML content.
 */
const cleanHtmlWhitespace = (html) => {
  return html
    // Remove excessive newlines (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Remove whitespace between HTML tags
    .replace(/>\s+</g, '><')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
};

/**
 * Parses and converts markdown to HTML.
 * @param {string} fileContent - The markdown file content.
 * @returns {object} - The parsed data and HTML content.
 */
export const parseMarkdown = (fileContent) => {
  if (typeof fileContent !== 'string') {
    throw new Error('File content must be a string');
  }
  try {
    const { data, content } = matter(fileContent);
    let htmlContent = marked(content || '');
    // Clean up whitespace
    htmlContent = cleanHtmlWhitespace(htmlContent);
    return { data: data || {}, htmlContent };
  } catch (error) {
    throw new Error(`Failed to parse markdown: ${error.message}`);
  }
};

/**
 * Processes markdown files in a directory.
 * @param {string} directory - The directory containing markdown files.
 * @param {object} [options] - Options for processing markdown files.
 * @returns {Array} - An array of processed posts.
 * @throws {Error} - If directory is not a string or options is not an object.
 */
export const processMarkdownFiles = (directory, options = {}) => {
  if (typeof directory !== 'string') {
    throw new Error('Directory must be a string');
  }
  if (options && (typeof options !== 'object' || Array.isArray(options))) {
    throw new Error('Options must be an object');
  }

  // Return empty array if directory doesn't exist
  if (!fs.existsSync(directory)) {
    return [];
  }

  const { previewLength = Number.POSITIVE_INFINITY } = options;
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'));

  return files.map((file) => {
    const filePath = path.join(directory, file);
    const fileContent = readFileContent(filePath);
    const { data, htmlContent } = parseMarkdown(fileContent);

    // For preview content, remove the first H1 to avoid duplicate titles
    let previewHtml = htmlContent;
    if (previewLength < Number.POSITIVE_INFINITY) {
      const previewDom = new JSDOM(htmlContent);
      const previewDoc = previewDom.window.document;
      const firstH1 = previewDoc.querySelector('h1');
      if (firstH1) {
        firstH1.remove();
        previewHtml = previewDoc.body.innerHTML;
      }
    }

    return {
      ...data, // Include all front matter data
      htmlFileName: file.replace('.md', '.html'),
      content: htmlContent,
      previewContent: getFirstNthCharacters(previewHtml, previewLength),
    };
  });
};

/**
 * Replaces placeholders in a template with corresponding values.
 * @param {string} template - The template content.
 * @param {object} values - The values to replace the placeholders with.
 * @returns {string} - The template with placeholders replaced.
 * @throws {Error} - If template is not a string or values is not an object.
 */
export const replacePlaceholders = (template, values) => {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('Values must be an object');
  }
  return template.replace(/{{(\w+)}}/g, (placeholder, key) => {
    let value = key in values ? values[key] : placeholder;
    // Strip newlines from page breadcrumb to prevent layout shifts
    if (key === 'page' && typeof value === 'string') {
      value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return value;
  });
};

/**
 * Escapes a value for use in YAML front matter.
 * @param {*} value - The value to escape.
 * @returns {string} - The escaped value as a string.
 */
const escapeYamlValue = (value) => {
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
 * Truncates plain text to a specified length.
 * @param {string} text - The text to truncate.
 * @param {number} length - The maximum length.
 * @returns {string} - The truncated text.
 */
export const truncateText = (text, length = 50) => {
  if (typeof text !== 'string') {
    return '';
  }
  if (text.length <= length) {
    return text;
  }
  return text.substring(0, length).trim() + '...';
};

/**
 * Generates front matter string from a data object and additional options.
 * @param {object} data - The metadata object.
 * @param {object} [options={}] - Additional options to include in the front matter.
 * @returns {string} - The front matter string.
 */
export const generateFrontMatter = (data, options = {}) => {
  const mergedData = { ...data, ...options };
  return `---\n${Object.entries(mergedData)
    .map(([key, value]) => `${key}: ${escapeYamlValue(value)}`)
    .join('\n')}\n---`;
};
