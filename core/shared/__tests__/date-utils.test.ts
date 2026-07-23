import { test } from 'node:test';
import assert from 'node:assert';
import { parseDate, formatDateISO } from '../date-utils.js';

test('parseDate: ISO 8601 format (YYYY-MM-DD)', () => {
  const date = parseDate('2026-01-03');
  assert.strictEqual(date.getFullYear(), 2026);
  assert.strictEqual(date.getMonth(), 0); // January is 0
  assert.strictEqual(date.getDate(), 3);
});

test('parseDate: DD.MM.YYYY format', () => {
  const date = parseDate('03.01.2026');
  assert.strictEqual(date.getFullYear(), 2026);
  assert.strictEqual(date.getMonth(), 0);
  assert.strictEqual(date.getDate(), 3);
});

test('parseDate: rejects invalid format', () => {
  assert.throws(() => parseDate('invalid'), /Invalid date format/);
});

test('parseDate: rejects invalid date values', () => {
  assert.throws(() => parseDate('32.13.2026'), /Invalid date/);
});

test('parseDate: rejects empty string', () => {
  assert.throws(() => parseDate(''), /Date string must be a non-empty string/);
});

test('formatDateISO: formats date correctly', () => {
  const date = new Date(2026, 0, 3); // January 3, 2026
  const formatted = formatDateISO(date);
  assert.strictEqual(formatted, '2026-01-03');
});

test('formatDateISO: pads single digit months and days', () => {
  const date = new Date(2026, 8, 5); // September 5, 2026
  const formatted = formatDateISO(date);
  assert.strictEqual(formatted, '2026-09-05');
});

test('formatDateISO: rejects invalid date', () => {
  assert.throws(() => formatDateISO('invalid' as unknown as Date), /Invalid date object/);
});
