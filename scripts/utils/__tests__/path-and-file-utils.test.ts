import { test } from 'node:test';
import assert from 'node:assert';
import { sanitizeFilename, filePathToWebPath } from '../path-and-file-utils.js';

test('sanitizeFilename: removes invalid filesystem characters', () => {
  // Multiple invalid chars get collapsed to single dash
  assert.strictEqual(sanitizeFilename('file<>name.txt'), 'file-name.txt');
  assert.strictEqual(sanitizeFilename('file:name.txt'), 'file-name.txt');
  assert.strictEqual(sanitizeFilename('file|name.txt'), 'file-name.txt');
});

test('sanitizeFilename: replaces spaces with dashes', () => {
  assert.strictEqual(sanitizeFilename('my file name.txt'), 'my-file-name.txt');
});

test('sanitizeFilename: collapses multiple dashes', () => {
  assert.strictEqual(sanitizeFilename('file---name.txt'), 'file-name.txt');
});

test('sanitizeFilename: removes leading/trailing dashes', () => {
  assert.strictEqual(sanitizeFilename('-filename-'), 'filename');
  assert.strictEqual(sanitizeFilename('--filename--'), 'filename');
});

test('sanitizeFilename: rejects non-string input', () => {
  assert.throws(() => sanitizeFilename(123 as unknown as string), /Filename must be a string/);
});

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
