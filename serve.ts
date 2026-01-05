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
import fs from 'fs/promises';

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
 * HTTP server request handler.
 * Serves static files from the public directory with path traversal protection.
 * Handles 404 errors by checking for directory-specific 404.html files.
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 */
const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
  try {
    // Normalize the requested path and remove leading slashes for relative resolution
    const url = req.url || '/';
    const requestedPath = path.normalize(url.split('?')[0]).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.resolve(publicDir, requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath);

    // Ensure the resolved path is within the public directory by checking it starts with publicDir
    if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden: Path traversal detected', 'utf-8');
      return;
    }

    // If the request points to a directory, serve the index.html file
    let stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      // If file not found, try finding a 404.html in the requested directory first
      const url = req.url || '/';
      const requestedPath = path.normalize(url.split('?')[0]).replace(/^(\.\.[\/\\])+/, '');
      const directoryPath = path.resolve(publicDir, requestedPath.startsWith('/') ? requestedPath.slice(1) : requestedPath);

      // Ensure directory path is still within public directory
      if (!directoryPath.startsWith(publicDir + path.sep) && directoryPath !== publicDir) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found', 'utf-8');
        return;
      }

      const notFoundPath = path.join(directoryPath, '404.html');

      try {
        const notFoundContent = await fs.readFile(notFoundPath);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(notFoundContent, 'utf-8');
      } catch {
        // If no specific 404.html in the directory, fall back to the root 404.html
        try {
          const defaultNotFoundContent = await fs.readFile(
            path.join(publicDir, '404.html'),
          );
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(defaultNotFoundContent, 'utf-8');
        } catch {
          // If no 404.html is found at all
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found', 'utf-8');
        }
      }
    } else {
      res.writeHead(500);
      res.end(`Server error: ${err.code}`, 'utf-8');
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

