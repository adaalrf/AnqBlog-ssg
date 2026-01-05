/**
 * Sitemap page entry.
 */
interface SitemapPage {
  url: string;
  lastmod?: Date;
}

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
 * Generates a sitemap.xml string from an array of page URLs.
 * @param pages - Array of page objects with url and optional lastmod date.
 * @returns The sitemap XML string.
 */
export function generateSitemap(pages: SitemapPage[]): string {
  const urlEntries = pages.map((page) => {
    const lastmod = page.lastmod
      ? page.lastmod.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const url = escapeXml(page.url);

    return `    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
    </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

