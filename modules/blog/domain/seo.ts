import path from 'path';
import type { Config } from '../../../core/types/config.js';
import { writeFileContent } from '../../../core/shared/path-and-file-utils.js';
import { generateRSSFeed } from '../../../core/pipeline/generate-rss.js';
import { generateSitemap } from '../../../core/pipeline/generate-sitemap.js';
import { getTagSlug } from '../utils/content-utils.js';
import type { BlogModuleConfig, Post, Tags } from '../types.js';

export const buildBlogSitemapPages = (
  posts: Post[],
  tags: Tags,
  config: Config & BlogModuleConfig,
): { url: string; lastmod: Date }[] => {
  return [
    { url: config.siteUrl, lastmod: new Date() },
    {
      url: `${config.siteUrl}/blog`,
      lastmod: posts.length > 0 ? posts[0].date : new Date(),
    },
    ...posts.map((post) => ({
      url: `${config.siteUrl}/blog/posts/${post.htmlFileName}`,
      lastmod: post.date,
    })),
    ...Object.keys(tags).map((tag) => {
      const tagPosts = posts.filter(
        (post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag),
      );
      const latestPostDate = tagPosts.length > 0 ? tagPosts[0].date : new Date();
      return {
        url: `${config.siteUrl}/blog/tags/${getTagSlug(tag)}.html`,
        lastmod: latestPostDate,
      };
    }),
    { url: `${config.siteUrl}/blog/tags`, lastmod: new Date() },
  ];
};

export const writeBlogRss = async (
  posts: Post[],
  config: Config & BlogModuleConfig,
): Promise<void> => {
  const rssPath = path.join(config.publicContentOutputDirectory, 'rss.xml');
  const items = posts.map((post) => ({
    title: post.title,
    url: `${config.siteUrl}/blog/posts/${post.htmlFileName}`,
    date: post.date,
    description: post.previewContent,
  }));
  const rssContent = generateRSSFeed({
    siteName: config.siteName,
    siteUrl: config.siteUrl,
    siteDescription: config.siteDescription,
    siteLanguage: config.siteLanguage,
    items,
  });
  await writeFileContent(rssPath, rssContent);
};

export const writeBlogSitemap = async (
  posts: Post[],
  tags: Tags,
  config: Config & BlogModuleConfig,
): Promise<void> => {
  const sitemapPath = path.join(config.publicContentOutputDirectory, 'sitemap.xml');
  const sitemapContent = generateSitemap(buildBlogSitemapPages(posts, tags, config));
  await writeFileContent(sitemapPath, sitemapContent);
};
