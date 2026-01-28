import path from 'path';

/**
 * Converts a file system path to a web path.
 *
 * This utility converts paths relative to the public directory into web URLs.
 * For example, 'public/blog/index.html' becomes '/blog/'.
 *
 * @param filePath - The file system path (relative to public directory or absolute).
 * @param publicDir - The public directory path (e.g., config.publicContentOutputDirectory).
 * @returns The web path starting with '/'.
 * @throws {Error} If filePath is not a string or publicDir is not provided.
 */
export const filePathToWebPath = (filePath: string, publicDir: string): string => {
  if (typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
  if (!publicDir || typeof publicDir !== 'string') {
    throw new Error('publicDir must be provided');
  }

  let relativePath = path.relative(publicDir, filePath);
  relativePath = relativePath.replace(/\\/g, '/');

  if (relativePath.endsWith('/index.html')) {
    relativePath = relativePath.replace(/\/index\.html$/, '');
  }

  const webPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
  return webPath === '/' ? '/' : webPath;
};
