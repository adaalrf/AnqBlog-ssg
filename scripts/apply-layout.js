import {
  replacePlaceholders,
  injectContentIntoTemplate,
  parseHtmlFrontMatter,
  normalizeTagForFile,
  denormalizeTagFromFile,
} from './utils/content-utils.js';
import {
  fpr,
  readFileContent,
  ensureDirectoryExists,
  writeFileContent,
} from './utils/path-and-file-utils.js';
import fs from 'fs';
import path from 'path';
import config from './config.js';

/**
 * Generates the tags dropdown HTML.
 * @param {Object} tags - The tags object.
 * @param {string} currentFilePath - The current file path.
 * @returns {string} - The generated tags dropdown HTML.
 */
const generateTagsDropdown = (tags, currentFilePath) => {
  if (!currentFilePath) {
    console.error('(Apply-Layout.js): Error: currentFilePath is undefined');
    return '';
  }

  // Use absolute paths from site root for consistency
  return Object.keys(tags)
    .map((tag) => {
      const filesWithDash = normalizeTagForFile(tag);
      const filesWithoutDash = denormalizeTagFromFile(tag);
      return `<li><a href="/blog/tags/${filesWithDash}.html" class="dropdown-item">${filesWithoutDash}</a></li>`;
    })
    .join('\n');
};

/**
 * Applies the main layout to all HTML files in multiple directories.
 * @param {Array} directoryPairs - Array of directory pairs (input and output).
 * @param {Object} tags - Tags object.
 */
export const applyLayoutToHtmlFiles = (directoryPairs, tags) => {
  const processedDirs = new Set();
  // Cache templates to avoid reading them multiple times
  const templateCache = {
    mainLayout: null,
    specificTemplates: {},
  };

  directoryPairs.forEach(({ inputDir, outputDir }) => {
    processDirectory(inputDir, outputDir, tags, processedDirs, templateCache);
  });
};

/**
 * Processes a single directory to apply the main layout to HTML files.
 * Recursively processes subdirectories and applies templates to HTML files.
 * @param {string} inputDir - The input directory to process.
 * @param {string} outputDir - The output directory for processed files.
 * @param {Object} tags - Tags object for generating dropdowns.
 * @param {Set<string>} processedDirs - Set of already processed directories to avoid duplicates.
 * @param {Object} templateCache - Cache object for storing template content.
 */
const processDirectory = (inputDir, outputDir, tags, processedDirs, templateCache) => {
  if (processedDirs.has(inputDir)) {
    return;
  }
  processedDirs.add(inputDir);

  // Skip if directory doesn't exist
  if (!fs.existsSync(inputDir)) {
    return;
  }

  const files = fs.readdirSync(inputDir);

  files.forEach((file) => {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);

    if (file === 'posts') {
      return;
    }

    if (fs.statSync(inputFilePath).isDirectory()) {
      ensureDirectoryExists(outputFilePath);
      processDirectory(inputFilePath, outputFilePath, tags, processedDirs, templateCache);
    } else if (file.endsWith('.html')) {
      const fileContent = readFileContent(inputFilePath);
      const { data, content } = parseHtmlFrontMatter(fileContent);

      const templateFilePath = path.join(
        fpr('src/templates'),
        `${path.basename(file, '.html')}-template.html`,
      );

      const specificTemplateExists = fs.existsSync(templateFilePath);

      // If a specific template exists, inject the content into it
      let mainContent;
      if (specificTemplateExists) {
        // Cache specific templates
        if (!templateCache.specificTemplates[templateFilePath]) {
          templateCache.specificTemplates[templateFilePath] = readFileContent(templateFilePath);
        }
        const templateContent = templateCache.specificTemplates[templateFilePath];
        const dom = injectContentIntoTemplate(templateContent, {
          ...data,
          content,
        });
        mainContent = dom.window.document.querySelector('body').innerHTML;
        // Else, apply the main layout to the content
      } else {
        mainContent = content;
      }

      // All assets are at the site root, use absolute paths from root
      const tagsDropdownContent = generateTagsDropdown(tags, outputFilePath);
      // Cache main layout template
      if (!templateCache.mainLayout) {
        templateCache.mainLayout = readFileContent(config.mainLayoutPath);
      }
      const mainLayoutContent = templateCache.mainLayout;

      const finalTitle = `${config.siteName} | ${data.title || ''}`;
      // Replace placeholders in the main layout - all assets are at root
      // Provide defaults for missing fields
      const finalHtml = replacePlaceholders(mainLayoutContent, {
        ...data,
        title: finalTitle,
        page: data.page || '', // Default to empty if not provided
        children: mainContent,
        tagsDropdown: tagsDropdownContent,
        stylesPath: '/styles/styles.css',
        faviconPath: '/assets/favicon.ico',
        scriptPath: '/js/bundle.js',
        gitLogoPath: '/assets/github-icon.svg',
      });

      writeFileContent(outputFilePath, finalHtml);
      console.log(`(Apply-Layout.js): Processed page -> ${outputFilePath}`);
    }
  });
};
