// Description: This script generates final post HTML files with layout.
import {
  readFileContent,
  replacePlaceholders,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import fs from 'fs';
import path from 'path';
import { fr, rp } from '../utils/resolve-path.js';

/**
 * Generates final post HTML files with layout.
 * @param {Array} posts - The array of posts.
 * @param {string} mainLayoutPath - The path to the main layout template.
 * @param {string} postOutputDirectory - The directory where intermediate posts are stored.
 * @param {string} publicPostsDirectory - The directory to save the final posts.
 */
export const generateFinalPostHtmlFiles = (
  posts,
  mainLayoutPath,
  postOutputDirectory,
  publicPostsDirectory,
) => {
  ensureDirectoryExists(publicPostsDirectory);
  const mainLayoutContent = readFileContent(mainLayoutPath);

  posts.forEach((post) => {
    const { title, htmlFileName } = post;
    const postContentPath = path.join(postOutputDirectory, htmlFileName);
    const postContent = readFileContent(postContentPath);

    const relativeOutputPath = rp(
      publicPostsDirectory,
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

    fs.writeFileSync(path.join(publicPostsDirectory, htmlFileName), finalHtml);
    console.log(`Generated ${path.join(publicPostsDirectory, htmlFileName)}`);
  });
};
