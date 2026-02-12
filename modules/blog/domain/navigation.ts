import { denormalizeTagFromFile, escapeHtml, getTagSlug } from '../utils/content-utils.js';
import type { Post, Tags } from '../types.js';

export const collectTags = (posts: Post[]): Tags => {
  const tags: Tags = {};
  posts.forEach((post) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        const normalizedTag = typeof tag === 'string' ? tag.trim() : String(tag).trim();
        if (!normalizedTag) {
          return;
        }
        if (!tags[normalizedTag]) {
          tags[normalizedTag] = [];
        }
        tags[normalizedTag].push(post);
      });
    }
  });
  return tags;
};

export const renderTagsDropdown = (tags: Tags): string => {
  return Object.keys(tags)
    .map((tag) => {
      const filesWithDash = getTagSlug(tag);
      const filesWithoutDash = denormalizeTagFromFile(tag);
      return `<li><a href="/blog/tags/${filesWithDash}.html" class="dropdown-item">${escapeHtml(
        filesWithoutDash,
      )}</a></li>`;
    })
    .join('\n');
};
