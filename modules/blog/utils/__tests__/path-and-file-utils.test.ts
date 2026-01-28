import { test } from 'node:test';
import assert from 'node:assert';
import { filePathToWebPath } from '../path-and-file-utils.js';

test('filePathToWebPath: converts index.html to directory path', () => {
  // Note: function only removes /index.html, not index.html at root level
  const webPath = filePathToWebPath('public/blog/index.html', 'public');
  assert.strictEqual(webPath, '/blog');
});

test('filePathToWebPath: converts regular html file', () => {
  const webPath = filePathToWebPath('public/blog/blog-page-2.html', 'public');
  assert.strictEqual(webPath, '/blog/blog-page-2.html');
});

test('filePathToWebPath: handles root index.html', () => {
  // Note: function requires /index.html pattern, root index.html stays as /index.html
  const webPath = filePathToWebPath('public/index.html', 'public');
  assert.strictEqual(webPath, '/index.html');
});

test('filePathToWebPath: rejects missing publicDir', () => {
  assert.throws(
    () => filePathToWebPath('public/blog/index.html', ''),
    /publicDir must be provided/,
  );
});
