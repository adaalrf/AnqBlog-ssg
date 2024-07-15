// path-and-file-utils.js

import fs from 'fs';
import path from 'path';

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

// Function to find the project root by looking for a marker file (e.g., package.json)
// in the full directory tree
const findRoot = (dir) => {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    throw new Error('Project root not found');
  }
  return findRoot(parentDir);
};

const projectRoot = findRoot(process.cwd());

// Function to resolve paths relative to the project root
export const fr = (relativePath) => path.join(projectRoot, relativePath);

// Function to find the project root by looking for a marker file (e.g., package.json)
// and return the path to the project root
const findProjectRoot = (dir) => {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    throw new Error('Project root not found');
  }
  return findProjectRoot(parentDir);
};
// Function to resolve paths relative to the project root
export const fpr = (relativePath) =>
  path.join(path.basename(findProjectRoot(relativePath)), relativePath);

// Function to calculate the relative path based on the depth
export const rp = (outputDir, file, baseDir) => {
  const outputFilePath = path.join(outputDir, file);
  const relativePath = path.posix.relative(
    path.posix.dirname(outputFilePath),
    baseDir,
  );
  return relativePath ? relativePath + '/' : '';
};
