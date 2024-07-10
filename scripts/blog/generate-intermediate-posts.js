// Description: Generates intermediate post HTML files.
import {
  readFileContent,
  injectContentIntoTemplate,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import fs from 'fs';
import path from 'path';

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
    const { title, date, tags, htmlFileName, content } = post;
    const templateContent = readFileContent(postTemplatePath);
    const dom = injectContentIntoTemplate(templateContent, {
      title,
      date,
      tags,
      content,
    });
    const contentDiv = dom.window.document.querySelector('.content-div');

    if (!contentDiv) {
      throw new Error(
        `Element '.content-div' not found in template ${postTemplatePath}`,
      );
    }

    const htmlContent = contentDiv.outerHTML;
    const outputPath = path.join(tempPostsOutputDirectory, htmlFileName);
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`Generated intermediate post HTML: ${outputPath}`);
  });
};
