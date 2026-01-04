import fs from 'fs';
import path from 'path';

/**
 * Reads the content of a file.
 * @param {string} filePath - The path to the file.
 * @returns {string} - The content of the file.
 * @throws {Error} - If filePath is not a string.
 */
export const readFileContent = (filePath) => {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
  return fs.readFileSync(filePath, 'utf8');
};

/**
 * Writes content to a file.
 * @param {string} filePath - The path to the file.
 * @param {string} content - The content to write.
 * @throws {Error} - If filePath is not a string or content is not a string.
 */
export const writeFileContent = (filePath, content) => {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }
  fs.writeFileSync(filePath, content);
};

/**
 * Ensures that the directory for a given file path exists, and if the path itself is intended to be a directory, creates it.
 * @param {string} filePath - The file path for which to ensure the directory exists.
 * @throws {Error} - If filePath is not a string.
 */
export const ensureDirectoryExists = (filePath) => {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
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

/**
 * Finds the project root by looking for package.json in the directory tree.
 * @param {string} startDir - The directory to start searching from.
 * @returns {string} - The absolute path to the project root.
 * @throws {Error} - If project root is not found.
 */
const findProjectRoot = (startDir) => {
  const dir = path.resolve(startDir);
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    throw new Error('Project root not found');
  }
  return findProjectRoot(parentDir);
};

// Cache the project root to avoid repeated lookups
const projectRoot = findProjectRoot(process.cwd());

/**
 * Resolves a path relative to the project root.
 * @param {string} relativePath - Path relative to project root.
 * @returns {string} - Absolute path resolved from project root.
 * @throws {Error} - If relativePath is not a string.
 */
export const fpr = (relativePath) => {
  if (typeof relativePath !== 'string') {
    throw new Error('Relative path must be a string');
  }
  return path.join(projectRoot, relativePath);
};

/**
 * Sanitizes a filename by removing/replacing invalid filesystem characters.
 * @param {string} filename - The filename to sanitize.
 * @returns {string} - The sanitized filename.
 * @throws {Error} - If filename is not a string.
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') {
    throw new Error('Filename must be a string');
  }
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-') // Remove invalid filesystem characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
};

