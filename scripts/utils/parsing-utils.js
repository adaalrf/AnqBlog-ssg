import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import truncate from 'html-truncate';

/**
 * Reads and parses configuration from a file.
 * @param {string} configPath - The path to the configuration file.
 */
export const readConfig = (configPath) => {
  const markedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  marked.setOptions(markedConfig);
};

/**
 * Reads the content of a file.
 * @param {string} filePath - The path to the file.
 * @returns {string} - The content of the file.
 */
export const readFileContent = (filePath) => fs.readFileSync(filePath, 'utf8');

/**
 * Writes content to a file.
 * @param {string} filePath - The path to the file.
 * @param {string} content - The content to write.
 */
export const writeFileContent = (filePath, content) => {
  fs.writeFileSync(filePath, content);
};

/**
 * Ensures that the directory for a given file path exists, and if the path itself is intended to be a directory, creates it.
 *
 * @param {string} filePath - The file path for which to ensure the directory exists.
 */
export const ensureDirectoryExists = (filePath) => {
  const dirPath = path.dirname(filePath);

  // Ensure the directory containing the file path exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Ensure the file path itself is a directory if it's intended to be one
  if (!fs.existsSync(filePath) && path.extname(filePath) === '') {
    fs.mkdirSync(filePath, { recursive: true });
  }
};

/**
 * Gets the first N characters of HTML content while preserving structure.
 * @param {string} htmlContent - The HTML content.
 * @param {number} length - The number of characters to truncate to.
 * @returns {string} - The truncated HTML content.
 */
export const getFirstNthCharacters = (htmlContent, length = 250) =>
  truncate(htmlContent, length, { ellipsis: '...' });

/**
 * Injects content into a template.
 * @param {string} templateContent - The template content.
 * @param {object} data - The data to inject.
 * @param {object} [options] - Options for injecting tags.
 * @returns {object} - The DOM object with injected content.
 */
export const injectContentIntoTemplate = (
  templateContent,
  data,
  options = {},
) => {
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
  const { data, content } = matter(fileContent);
  return { data, content };
};

/**
 * Parses and converts markdown to HTML.
 * @param {string} fileContent - The markdown file content.
 * @returns {object} - The parsed data and HTML content.
 */
export const parseMarkdown = (fileContent) => {
  const { data, content } = matter(fileContent);
  const htmlContent = marked(content);
  return { data, htmlContent };
};

/**
 * Processes markdown files in a directory.
 * @param {string} directory - The directory containing markdown files.
 * @param {object} [options] - Options for processing markdown files.
 * @returns {Array} - An array of processed posts.
 */
export const processMarkdownFiles = (directory, options = {}) => {
  const { previewLength = Number.POSITIVE_INFINITY } = options;
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'));

  return files.map((file) => {
    const filePath = path.join(directory, file);
    const fileContent = readFileContent(filePath);
    const { data, htmlContent } = parseMarkdown(fileContent);

    return {
      ...data, // Include all front matter data
      htmlFileName: file.replace('.md', '.html'),
      content: htmlContent,
      previewContent: getFirstNthCharacters(htmlContent, previewLength),
    };
  });
};

/**
 * Replaces placeholders in a template with corresponding values.
 * @param {string} template - The template content.
 * @param {object} values - The values to replace the placeholders with.
 * @returns {string} - The template with placeholders replaced.
 */
export const replacePlaceholders = (template, values) => {
  return template.replace(/{{(\w+)}}/g, (placeholder, key) => {
    return key in values ? values[key] : placeholder;
  });
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
    .map(([key, value]) => `${key}: "${value}"`)
    .join('\n')}\n---`;
};
