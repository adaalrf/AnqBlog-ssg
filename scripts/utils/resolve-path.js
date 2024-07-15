import path, { relative } from 'path';
import fs from 'fs';

/**
 * Finds the project root by looking for a marker file (e.g., package.json).
 * @param {string} dir - The current directory.
 * @returns {string} - The path to the project root.
 * @throws {Error} - If the project root is not found.
 */
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

/**
 * Resolves a path relative to the project root.
 * @param {string} relativePath - The relative path to resolve.
 * @returns {string} - The resolved absolute path.
 */
export const fr = (relativePath) => path.join(projectRoot, relativePath);

/**
 * Finds the project root by looking for a marker file (e.g., package.json) and returns the path to the project root.
 * @param {string} dir - The current directory.
 * @returns {string} - The path to the project root.
 * @throws {Error} - If the project root is not found.
 */
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

/**
 * Resolves a path relative to the project root.
 * @param {string} relativePath - The relative path to resolve.
 * @returns {string} - The resolved absolute path.
 */
export const fpr = (relativePath) =>
  path.join(path.basename(findProjectRoot(relativePath)), relativePath);

/**
 * Calculates the relative path based on the depth.
 * @param {string} outputDir - The output directory.
 * @param {string} file - The file name.
 * @param {string} baseDir - The base directory.
 * @returns {string} - The relative path.
 */
export const rp = (outputDir, file, baseDir) => {
  const outputFilePath = path.join(outputDir, file);
  const relativePath = path.posix.relative(
    path.posix.dirname(outputFilePath),
    baseDir,
  );
  return relativePath ? relativePath + '/' : '';
};
