import { test } from 'node:test';
import assert from 'node:assert';
import { sanitizeFilename } from '../path-and-file-utils.js';

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
