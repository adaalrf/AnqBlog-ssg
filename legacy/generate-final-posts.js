// Description: This script generates final post HTML files with layout.
import {
  readFileContent,
  replacePlaceholders,
  ensureDirectoryExists,
} from '../scripts/utils/parsing-utils.js';
import fs from 'fs';
import path from 'path';
import { fr, rp } from '../scripts/utils/resolve-path.js';

/**
 * Generates final post HTML files with layout.
 * @param {Array} posts - The array of posts.
 * @param {string} mainLayoutPath - The path to the main layout template.
 * @param {string} tempPostsOutputDirectory - The directory where intermediate posts are stored.
 * @param {string} publicPostsOutputDirectory - The directory to save the final posts.
 */
export const generateFinalPostHtmlFiles = (
  posts,
  mainLayoutPath,
  tempPostsOutputDirectory,
  publicPostsOutputDirectory,
) => {
  ensureDirectoryExists(publicPostsOutputDirectory);
  const mainLayoutContent = readFileContent(mainLayoutPath);

  posts.forEach((post) => {
    const { title, htmlFileName } = post;
    const postContentPath = path.join(tempPostsOutputDirectory, htmlFileName);
    const postContent = readFileContent(postContentPath);

    const relativeOutputPath = rp(
      publicPostsOutputDirectory,
      htmlFileName,
      fr('public'),
    );

    const finalHtml = replacePlaceholders(mainLayoutContent, {
      title,
      children: postContent,
      stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
      faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
      scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
      gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
    });

    fs.writeFileSync(
      path.join(publicPostsOutputDirectory, htmlFileName),
      finalHtml,
    );
    console.log(
      `Generated ${path.join(publicPostsOutputDirectory, htmlFileName)}`,
    );
  });
};
