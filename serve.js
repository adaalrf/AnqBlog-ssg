// serve.js
// This script creates a simple HTTP server that serves static files from the public directory. It reads the requested file from the public directory, determines the content type based on the file extension,
// and sends the file content as the response. If the requested file is not found, it looks for a 404.html file in the requested directory or falls back to the root 404.html file.
// If no 404.html file is found, it sends a plain text response with "404 Not Found". If there is a server error, it sends a 500 status code with an error message.
// The server listens on the specified port (default 8080) and logs the server URL when it starts.
// To run the server, execute the script with Node.js: "node run serve"
// The server will start and serve files from the public directory. You can access the server at http://localhost:8080.
// Note: This script is NOT suitable for production use. It does not handle concurrent requests, caching, security, or other advanced features typically found in production servers.

import http from 'http';
import path from 'path';
import fs from 'fs/promises';

const port = process.env.PORT || 8080;
const publicDir = path.resolve('./public');

const server = http.createServer(async (req, res) => {
  try {
    let filePath = path.join(publicDir, req.url);

    // If the request points to a directory, serve the index.html file
    let stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
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
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file not found, try finding a 404.html in the requested directory first
      const directoryPath = path.join(publicDir, req.url);
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
      res.end(`Server error: ${error.code}`, 'utf-8');
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
