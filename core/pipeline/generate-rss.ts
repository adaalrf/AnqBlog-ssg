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
 * RSS feed item definition.
 */
export interface RSSItem {
  title: string;
  url: string;
  date: Date;
  description?: string;
}

/**
 * RSS feed configuration.
 */
export interface RSSFeedConfig {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  siteLanguage: string;
  feedUrl?: string;
  items: RSSItem[];
}

/**
 * Generates an RSS 2.0 feed XML string from an array of items.
 * Limits the feed to the 20 most recent entries.
 * @param config - Feed configuration and items.
 * @returns The RSS feed XML string.
 */
export function generateRSSFeed(config: RSSFeedConfig): string {
  const feedItems = config.items.slice(0, 20);
  const feedUrl = config.feedUrl ?? `${config.siteUrl}/rss.xml`;

  const items = feedItems
    .map((item) => {
      const url = item.url;
      const pubDate = new Date(item.date).toUTCString();
      const description = escapeXml(item.description || '');

      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.siteName)}</title>
    <link>${config.siteUrl}</link>
    <description>${escapeXml(config.siteDescription)}</description>
    <language>${config.siteLanguage}</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}
