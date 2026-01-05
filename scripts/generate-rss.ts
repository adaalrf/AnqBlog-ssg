import config from './config.js';
import type { Post } from './types/index.js';

/**
 * Escapes XML special characters to prevent XML injection.
 * @param str - The string to escape.
 * @returns The escaped string safe for XML insertion.
 */
function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an RSS 2.0 feed XML string from an array of posts.
 * @param posts - Array of post objects with title, date, htmlFileName, previewContent.
 * @returns The RSS feed XML string.
 */
export function generateRSSFeed(posts: Post[]): string {
  // Limit to 20 most recent posts
  const feedPosts = posts.slice(0, 20);

  const items = feedPosts.map((post) => {
    const url = `${config.siteUrl}/blog/posts/${post.htmlFileName}`;
    const pubDate = new Date(post.date).toUTCString();
    const description = escapeXml(post.previewContent || '');

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.siteName)}</title>
    <link>${config.siteUrl}</link>
    <description>${escapeXml(config.siteDescription)}</description>
    <language>${config.siteLanguage}</language>
    <atom:link href="${config.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

