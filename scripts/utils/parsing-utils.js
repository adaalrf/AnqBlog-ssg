const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const matter = require('gray-matter');
const { marked } = require('marked');
const truncate = require('html-truncate');

// Read and parse configuration
const readConfig = (configPath) => {
  const markedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  marked.setOptions(markedConfig);
};

// Read a file's content
const readFileContent = (filePath) => fs.readFileSync(filePath, 'utf8');

// Utility function to get the first 250 characters of HTML content while preserving structure
const getFirstNthCharacters = (htmlContent, length = 250) =>
  truncate(htmlContent, length, { ellipsis: '...' });

// Inject content into template
const injectContentIntoTemplate = (templateContent, data, options = {}) => {
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

// Parse and convert markdown to HTML
const parseMarkdown = (fileContent) => {
  const { data, content } = matter(fileContent);
  const htmlContent = marked(content);
  return { data, htmlContent };
};

// Process markdown files
const processMarkdownFiles = (directory, options = {}) => {
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

module.exports = {
  readConfig,
  readFileContent,
  injectContentIntoTemplate,
  processMarkdownFiles,
};
