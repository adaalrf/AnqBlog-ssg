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
    const placeholder = new RegExp(`{{${key}}}`, 'g');
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
  const { previewLength = 250 } = options;
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.md'));

  return files.map((file) => {
    const filePath = path.join(directory, file);
    const fileContent = readFileContent(filePath);
    const { data, htmlContent } = parseMarkdown(fileContent);

    if (!data.title) {
      throw new Error(`Title is missing in front matter of file: ${file}`);
    }

    return {
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      htmlFileName: file.replace('.md', '.html'),
      content: htmlContent,
      previewContent: getFirstNthCharacters(htmlContent, previewLength),
    };
  });
};

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} directory - The directory to ensure exists.
 */
export const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
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
