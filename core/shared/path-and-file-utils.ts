import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Reads the content of a file asynchronously.
 * @param filePath - The path to the file.
 * @returns Promise that resolves to the content of the file.
 * @throws {Error} If filePath is not a string.
 */
export const readFileContent = async (filePath: string): Promise<string> => {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
  return await fsPromises.readFile(filePath, 'utf8');
};

/**
 * Writes content to a file asynchronously.
 * @param filePath - The path to the file.
 * @param content - The content to write.
 * @returns Promise that resolves when the file is written.
 * @throws {Error} If filePath is not a string or content is not a string.
 */
export const writeFileContent = async (filePath: string, content: string): Promise<void> => {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }
  await fsPromises.writeFile(filePath, content, 'utf8');
};

/**
 * Ensures that the directory for a given file path exists, and if the path itself is intended to be a directory, creates it.
 * @param filePath - The file path for which to ensure the directory exists.
 * @throws {Error} If filePath is not a string.
 */
export const ensureDirectoryExists = (filePath: string): void => {
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
 * @param startDir - The directory to start searching from.
 * @returns The absolute path to the project root.
 * @throws {Error} If project root is not found.
 */
const findProjectRoot = (startDir: string): string => {
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
 *
 * This utility ensures all paths are resolved consistently regardless of
 * where the script is executed from. It finds the project root by looking
 * for package.json and caches the result for performance.
 *
 * All paths in pathConfig use this utility to ensure they work correctly
 * whether scripts are run from project root or subdirectories.
 *
 * @param relativePath - Path relative to project root (e.g., 'templates/layout.html').
 * @returns Absolute path resolved from project root.
 * @throws {Error} If relativePath is not a string or if project root cannot be found (package.json missing).
 *
 * @example
 * // Returns: '/home/user/project/templates/layout.html'
 * fpr('templates/layout.html')
 *
 * @example
 * // Used in pathConfig:
 * inputCSS: fpr('styles/tailwind.css')
 */
export const fpr = (relativePath: string): string => {
  if (typeof relativePath !== 'string') {
    throw new Error('Relative path must be a string');
  }
  return path.join(projectRoot, relativePath);
};

/**
 * Sanitizes a filename by removing/replacing invalid filesystem characters.
 * @param filename - The filename to sanitize.
 * @returns The sanitized filename.
 * @throws {Error} If filename is not a string.
 */
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') {
    throw new Error('Filename must be a string');
  }

  return (
    filename
      // eslint-disable-next-line no-control-regex -- Control characters are intentionally filtered for filesystem safety
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-') // Remove invalid filesystem characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
  );
};
