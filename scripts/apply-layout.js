import {
  readFileContent,
  replacePlaceholders,
  injectContentIntoTemplate,
  parseHtmlFrontMatter,
  ensureDirectoryExists,
} from './utils/parsing-utils.js';
import { fr, rp, fpr } from './utils/resolve-path.js';
import fs from 'fs';
import path from 'path';
import config from './config.js';

/**
 * Generates the tags dropdown HTML.
 * @param {object} tags - The tags object.
 * @param {string} currentFilePath - The current file path.
 * @returns {string} - The generated tags dropdown HTML.
 */
const generateTagsDropdown = (tags, currentFilePath) => {
  if (!currentFilePath) {
    console.error('Error: currentFilePath is undefined.');
    return '';
  }

  return Object.keys(tags)
    .map((tag) => {
      const relativePath = rp(
        path.dirname(currentFilePath),
        `${tag}.html`,
        fr('public/blog/tags'),
      );
      const filesWithDash = tag.split(' ').join('-');
      return `<li><a href="${relativePath}${filesWithDash}.html" class="dropdown-item">${tag}</a></li>`;
    })
    .join('\n');
};

/**
 * Applies the main layout to all HTML files in multiple directories.
 * @param {Array} directoryPairs - Array of directory pairs (input and output).
 * @param {object} tags - Tags object.
 */
export const applyLayoutToHtmlFiles = (directoryPairs, tags) => {
  const processedDirs = new Set();

  directoryPairs.forEach(({ inputDir, outputDir }) => {
    processDirectory(inputDir, outputDir, tags, processedDirs);
  });
};

/**
 * Processes a single directory to apply the main layout.
 * @param {string} inputDir - The input directory.
 * @param {string} outputDir - The output directory.
 * @param {object} tags - Tags object.
 * @param {Set} processedDirs - Set of processed directories.
 */
const processDirectory = (inputDir, outputDir, tags, processedDirs) => {
  if (processedDirs.has(inputDir)) {
    // console.log(`Skipping already processed directory: ${inputDir}`);
    return;
  }
  processedDirs.add(inputDir);

  const files = fs.readdirSync(inputDir);

  files.forEach((file) => {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);

    if (file === 'posts') {
      return;
    }

    if (fs.statSync(inputFilePath).isDirectory()) {
      ensureDirectoryExists(outputFilePath);
      processDirectory(inputFilePath, outputFilePath, tags, processedDirs);
    } else if (file.endsWith('.html')) {
      const fileContent = readFileContent(inputFilePath);
      const { data, content } = parseHtmlFrontMatter(fileContent);

      const templateFilePath = path.join(
        fpr('src/templates'),
        `${path.basename(file, '.html')}-template.html`,
      );

      //const dataPageExists = data && data.page && fs.existsSync(data.page); // Check if data.page exists
      const specificTemplateExists = fs.existsSync(templateFilePath);

      let mainContent;
      if (specificTemplateExists) {
        const templateContent = readFileContent(templateFilePath);
        const dom = injectContentIntoTemplate(templateContent, {
          ...data,
          content,
        });
        mainContent = dom.window.document.querySelector('body').innerHTML;
      } else {
        mainContent = content;
      }

      const relativeOutputPath = rp(
        path.dirname(outputFilePath),
        file,
        fr('public'),
      );
      const tagsDropdownContent = generateTagsDropdown(tags, outputFilePath);
      let mainLayoutContent = readFileContent(config.mainLayoutPath);
      let fileNameTitle = path
        .basename(file, '.html')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const finalTitle = `${config.siteName} | ${fileNameTitle}`;

      const finalHtml = replacePlaceholders(mainLayoutContent, {
        title: finalTitle,
        ...data,
        children: mainContent,
        tagsDropdown: tagsDropdownContent, // Add tags dropdown HTML
        stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
        faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
        scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
        gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
      });

      fs.writeFileSync(outputFilePath, finalHtml);
      console.log(`(Generate.js): Processed ${outputFilePath}`);
    }
  });
};
