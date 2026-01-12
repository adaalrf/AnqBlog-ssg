#!/usr/bin/env node
/**
 * Local development server for the static site generator.
 *
 * This script creates a simple HTTP server that serves static files from the
 * public directory. It handles:
 * - Static file serving with proper MIME types
 * - Directory index.html resolution
 * - 404 error handling with custom error pages
 * - Path traversal protection
 *
 * Usage:
 *   npm run serve
 *   PORT=3000 npm run serve  # Custom port
 *
 * The server listens on port 8080 by default (or PORT environment variable).
 * Access the site at http://localhost:8080
 *
 * **Important:** This server is for LOCAL DEVELOPMENT ONLY.
 * It is NOT suitable for production use. The generated static site in `public/`
 * can be served by any web server (Apache, Nginx, Caddy, etc.) without Node.js.
 */

import http from 'http';
import path from 'path';
import fsPromises from 'fs/promises';

const port = Number(process.env.PORT) || 8080;
const publicDir = path.resolve('./public');

/**
 * MIME types mapping for file extensions.
 */
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
};

/**
 * Validates that a resolved file path is within the public directory.
 * Prevents path traversal attacks by ensuring the path cannot escape the public directory.
 * @param resolvedPath - The resolved absolute file path.
 * @returns True if the path is safe (within public directory), false otherwise.
 */
function isPathSafe(resolvedPath: string): boolean {
  // Normalize paths to handle different separators
  const normalizedPublic = path.normalize(publicDir);
  const normalizedPath = path.normalize(resolvedPath);

  // Check that the resolved path starts with the public directory
  // This prevents ../ and similar traversal attempts
  return (
    normalizedPath === normalizedPublic || normalizedPath.startsWith(normalizedPublic + path.sep)
  );
}

/**
 * HTTP server request handler.
 * Serves static files from the public directory with path traversal protection.
 * Handles 404 errors by checking for directory-specific 404.html files.
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 */
const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse): void => {
  void (async () => {
    try {
      const requestUrl = new URL(req.url || '/', `http://localhost:${port}`);
      let requestedPath: string;
      try {
        requestedPath = decodeURIComponent(requestUrl.pathname);
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('400 Bad Request: Invalid URL encoding');
        return;
      }
      requestedPath = path.normalize(requestedPath);

      // Remove leading slash and resolve relative to public directory
      const relativePath = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;
      let filePath = path.resolve(publicDir, relativePath);

      // Path traversal protection: ensure the resolved path is within public directory
      if (!isPathSafe(filePath)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden: Path traversal attempt detected', 'utf-8');
        return;
      }

      // If the request points to a directory, serve the index.html file
      const stats = await fsPromises.stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        // Re-validate path safety after adding index.html (defensive check)
        if (!isPathSafe(filePath)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('403 Forbidden: Path traversal attempt detected', 'utf-8');
          return;
        }
      }

      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';

      const content = await fsPromises.readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        // File not found - try to serve a custom 404 page
        const requestUrl = new URL(req.url || '/', `http://localhost:${port}`);
        let requestedPath: string;
        try {
          requestedPath = decodeURIComponent(requestUrl.pathname);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found', 'utf-8');
          return;
        }
        requestedPath = path.normalize(requestedPath);
        const relativePath = requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath;

        // Use the containing directory for file-like requests.
        const resolvedRequestPath = path.resolve(publicDir, relativePath);
        const directoryPath = requestedPath.endsWith('/')
          ? resolvedRequestPath
          : path.dirname(resolvedRequestPath);

        // Ensure directory path is safe (path traversal protection)
        if (!isPathSafe(directoryPath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found', 'utf-8');
          return;
        }

        // Try to find a directory-specific 404.html first
        const notFoundPath = path.join(directoryPath, '404.html');

        try {
          const notFoundContent = await fsPromises.readFile(notFoundPath);
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(notFoundContent);
        } catch {
          // Fall back to root 404.html if directory-specific one doesn't exist
          try {
            const defaultNotFoundPath = path.join(publicDir, '404.html');
            const defaultNotFoundContent = await fsPromises.readFile(defaultNotFoundPath);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(defaultNotFoundContent);
          } catch {
            // No 404.html found anywhere - return plain text 404
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found: The requested file or directory does not exist.', 'utf-8');
          }
        }
      } else if (err.code === 'EACCES') {
        // Permission denied
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden: Permission denied', 'utf-8');
      } else if (err.code === 'EISDIR') {
        // Requested path is a directory but no index.html found
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: Directory index not found', 'utf-8');
      } else {
        // Other server errors
        const errorMessage = err.code
          ? `500 Internal Server Error: ${err.code}`
          : '500 Internal Server Error: An unexpected error occurred';
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(errorMessage, 'utf-8');
      }
    }
  })();
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
