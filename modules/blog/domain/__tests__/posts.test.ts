import assert from 'node:assert';
import { test } from 'node:test';
import { normalizeAndSortPosts } from '../posts.js';

test('normalizeAndSortPosts: sorts by date descending and applies defaults', () => {
  const input = [
    {
      title: 'Older',
      date: '2026-01-01',
      tags: ['a'],
      content: '<p>older</p>',
      previewContent: '<p>older</p>',
      htmlFileName: 'older.html',
    },
    {
      title: '',
      date: '2026-01-03',
      tags: [],
      content: '',
      previewContent: '',
      htmlFileName: 'newer.html',
    },
  ];

  const posts = normalizeAndSortPosts(input);
  assert.strictEqual(posts.length, 2);
  assert.strictEqual(posts[0].htmlFileName, 'newer.html');
  assert.strictEqual(posts[1].htmlFileName, 'older.html');
  assert.strictEqual(posts[0].title, 'Untitled');
});

test('normalizeAndSortPosts: handles invalid date by falling back to current date', () => {
  const input = [
    {
      title: 'Bad Date',
      date: 'not-a-date',
      tags: [],
      content: '<p>x</p>',
      previewContent: '<p>x</p>',
      htmlFileName: 'bad-date.html',
    },
  ];

  const posts = normalizeAndSortPosts(input);
  assert.strictEqual(posts.length, 1);
  assert.ok(posts[0].date instanceof Date);
});
