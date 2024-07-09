// Description: This script generates intermediate post HTML files from the post template.
const {
  readFileContent,
  injectContentIntoTemplate,
  ensureDirectoryExists,
} = require('../utils/parsing-utils');
const fs = require('fs');
const path = require('path');
const { formatDate } = require('../utils/date-utils');

/**
 * Helper function to generate HTML content.
 * @param {string} templatePath - The path to the template.
 * @param {object} data - The data to inject into the template.
 * @param {string} outputPath - The path to save the generated HTML content.
 */
const generateHtmlContent = (templatePath, data, outputPath) => {
  const templateContent = readFileContent(templatePath);
  const dom = injectContentIntoTemplate(templateContent, data);
  const contentDiv = dom.window.document.querySelector('.content-div');

  if (!contentDiv) {
    throw new Error(
      `Element '.content-div' not found in template ${templatePath}`,
    );
  }

  const htmlContent = contentDiv.outerHTML;
  fs.writeFileSync(outputPath, htmlContent);
};

/**
 * Generates intermediate post HTML files.
 * @param {Array} posts - The array of posts.
 * @param {string} postTemplatePath - The path to the post template.
 * @param {string} postOutputDirectory - The directory to save the generated files.
 */
const generateIntermediatePostHtmlFiles = (
  posts,
  postTemplatePath,
  postOutputDirectory,
) => {
  ensureDirectoryExists(postOutputDirectory);

  posts.forEach((post) => {
    const { title, date, tags, htmlFileName, content } = post;
    generateHtmlContent(
      postTemplatePath,
      { title, date: formatDate(date), tags, content },
      path.join(postOutputDirectory, htmlFileName),
    );
  });
};

module.exports = { generateIntermediatePostHtmlFiles };
