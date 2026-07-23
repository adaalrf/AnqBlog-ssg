import { test } from 'node:test';
import assert from 'node:assert';
import {
  normalizeTagForFile,
  denormalizeTagFromFile,
  escapeHtml,
  truncateText,
  getTagSlug,
  sanitizeGeneratedHtml,
} from '../content-utils.js';

test('normalizeTagForFile: replaces spaces with dashes', () => {
  assert.strictEqual(normalizeTagForFile('web development'), 'web-development');
  assert.strictEqual(normalizeTagForFile('getting started'), 'getting-started');
});

test('normalizeTagForFile: handles single word tags', () => {
  assert.strictEqual(normalizeTagForFile('tutorial'), 'tutorial');
});

test('normalizeTagForFile: rejects non-string input', () => {
  assert.throws(() => normalizeTagForFile(123 as unknown as string), /Tag must be a string/);
});

test('denormalizeTagFromFile: replaces dashes with spaces', () => {
  assert.strictEqual(denormalizeTagFromFile('web-development'), 'web development');
  assert.strictEqual(denormalizeTagFromFile('getting-started'), 'getting started');
});

test('denormalizeTagFromFile: handles tags without dashes', () => {
  assert.strictEqual(denormalizeTagFromFile('tutorial'), 'tutorial');
});

test('denormalizeTagFromFile: rejects non-string input', () => {
  assert.throws(() => denormalizeTagFromFile(123 as unknown as string), /Tag must be a string/);
});

test('escapeHtml: escapes HTML special characters', () => {
  assert.strictEqual(escapeHtml('& < > " \''), '&amp; &lt; &gt; &quot; &#039;');
  assert.strictEqual(escapeHtml('Hello & World'), 'Hello &amp; World');
});

test('escapeHtml: handles empty string', () => {
  assert.strictEqual(escapeHtml(''), '');
});

test('escapeHtml: handles non-string input', () => {
  assert.strictEqual(escapeHtml(123 as unknown as string), '');
});

test('truncateText: truncates long text', () => {
  const longText = 'This is a very long text that should be truncated';
  const truncated = truncateText(longText, 20);
  // The function does substring(0, 20).trim() + '...'
  // "This is a very long " (20 chars) -> "This is a very long" (19 chars after trim) -> "This is a very long..." (22 chars)
  assert.strictEqual(truncated, 'This is a very long...');
  assert.strictEqual(truncated.length, 22); // 19 chars + '...'
});

test('truncateText: does not truncate short text', () => {
  const shortText = 'Short';
  assert.strictEqual(truncateText(shortText, 20), 'Short');
});

test('truncateText: handles empty string', () => {
  assert.strictEqual(truncateText('', 10), '');
});

test('truncateText: handles non-string input', () => {
  assert.strictEqual(truncateText(123 as unknown as string, 10), '');
});

test('getTagSlug: generates safe, lowercase slugs', () => {
  assert.strictEqual(getTagSlug('Hello World!'), 'hello-world');
  assert.strictEqual(getTagSlug('  MULTI  CASE???  '), 'multi-case');
  assert.strictEqual(getTagSlug('!!!!'), 'tag');
});

test('sanitizeGeneratedHtml: removes scripts while keeping code blocks', () => {
  const html =
    '<div><script>alert("x")</script><code>&lt;script&gt;</code><a href="javascript:alert(1)">link</a></div>';
  const sanitized = sanitizeGeneratedHtml(html);
  assert.strictEqual(sanitized.includes('<script>'), false);
  assert.ok(sanitized.includes('<code>&lt;script&gt;</code>'));
  assert.strictEqual(sanitized.includes('href="javascript:'), false);
});

test('sanitizeGeneratedHtml: strips event handler attributes', () => {
  const html = '<button onclick="do()">Click</button>';
  const sanitized = sanitizeGeneratedHtml(html);
  assert.strictEqual(sanitized.includes('onclick'), false);
});
