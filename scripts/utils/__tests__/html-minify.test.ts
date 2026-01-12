import { test } from 'node:test';
import assert from 'node:assert';
import { minifyHtml } from '../html-minify.js';

test('minifyHtml: removes whitespace between tags', () => {
  const html = '<div>  <p>Hello</p>  </div>';
  const minified = minifyHtml(html);
  assert.strictEqual(minified, '<div><p>Hello</p></div>');
});

test('minifyHtml: preserves whitespace in pre tags', () => {
  const html = '<pre>  Hello\n  World  </pre>';
  const minified = minifyHtml(html);
  assert.ok(minified.includes('  Hello'));
  assert.ok(minified.includes('  World'));
});

test('minifyHtml: preserves whitespace in code tags', () => {
  const html = '<code>  const x = 1;  </code>';
  const minified = minifyHtml(html);
  assert.ok(minified.includes('  const x = 1;'));
});

test('minifyHtml: removes HTML comments', () => {
  const html = '<div><!-- This is a comment --><p>Hello</p></div>';
  const minified = minifyHtml(html);
  assert.strictEqual(minified, '<div><p>Hello</p></div>');
});

test('minifyHtml: handles empty string', () => {
  assert.strictEqual(minifyHtml(''), '');
});

test('minifyHtml: handles non-string input', () => {
  assert.strictEqual(minifyHtml(123 as unknown as string), 123);
});

test('minifyHtml: collapses multiple spaces', () => {
  const html = '<div>Hello    World</div>';
  const minified = minifyHtml(html);
  assert.ok(minified.includes('Hello World'));
});
