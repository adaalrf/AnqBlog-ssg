import assert from 'node:assert';
import { test } from 'node:test';
import { collectTags, renderTagsDropdown } from '../navigation.js';
import type { Post } from '../../types.js';

const createPost = (title: string, tags: string[]): Post => ({
  title,
  date: new Date('2026-01-01T00:00:00.000Z'),
  tags,
  content: `<p>${title}</p>`,
  previewContent: `<p>${title}</p>`,
  htmlFileName: `${title.toLowerCase().replace(/\s+/g, '-')}.html`,
});

test('collectTags: groups posts by normalized tag', () => {
  const posts: Post[] = [createPost('One', ['a', ' b ']), createPost('Two', ['b', ''])];

  const tags = collectTags(posts);
  assert.strictEqual(Object.keys(tags).length, 2);
  assert.strictEqual(tags.a?.length, 1);
  assert.strictEqual(tags.b?.length, 2);
});

test('renderTagsDropdown: renders escaped labels and slugged links', () => {
  const tags = {
    'C & C++': [createPost('One', ['C & C++'])],
  };

  const html = renderTagsDropdown(tags);
  assert.ok(html.includes('/blog/tags/c-c.html'));
  assert.ok(html.includes('C &amp; C++'));
});
