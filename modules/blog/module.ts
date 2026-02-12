import path from 'path';
import type { BlogModuleConfig, Config } from '../../core/types/config.js';
import type { Module, ModuleContext } from '../../core/types/module.js';
import { logger } from '../../core/shared/logger.js';
import { parseDate } from '../../core/shared/date-utils.js';
import { writeFileContent } from '../../core/shared/path-and-file-utils.js';
import {
  denormalizeTagFromFile,
  escapeHtml,
  getTagSlug,
  processMarkdownFiles,
} from './utils/content-utils.js';
import { generateRSSFeed } from '../../core/pipeline/generate-rss.js';
import { generateSitemap } from '../../core/pipeline/generate-sitemap.js';
import { generateIntermediatePostHtmlFiles } from './pipeline/posts.js';
import { generatePaginatedBlogHtmlFiles } from './pipeline/blog.js';
import { generateTagPages } from './pipeline/tags.js';
import type { Post, Tags } from './types.js';
import type { LayoutDirectoryPair } from '../../core/types/layout.js';

const blogModule: Module = {
  name: 'blog',
  validate: (config: Config): void => {
    getBlogConfig(config);
  },
  directoryPairs: (config: Config): LayoutDirectoryPair[] => {
    const blogConfig = getBlogConfig(config);
    return [
      {
        inputDir: blogConfig.tempPostsOutputDirectory,
        outputDir: blogConfig.publicPostsOutputDirectory,
      },
      {
        inputDir: blogConfig.tempTagsOutputDirectory,
        outputDir: blogConfig.publicTagsOutputDirectory,
      },
      {
        inputDir: blogConfig.tempBlogOutputPath,
        outputDir: blogConfig.publicBlogOutputPath,
      },
    ];
  },
  run: async (context: ModuleContext) => {
    const config = getBlogConfig(context.config);

    logger.info('blog-module', 'Processing markdown files...');
    const truncatedPosts = await processAndSortMarkdownFiles(config.postsContentDirectory, {
      previewLength: config.previewLength,
      maxFileSize: config.maxMarkdownFileSize,
    });

    const fullPosts = await processAndSortMarkdownFiles(config.postsContentDirectory, {
      maxFileSize: config.maxMarkdownFileSize,
    });
    logger.info(
      'blog-module',
      `Found ${fullPosts.length} post${fullPosts.length !== 1 ? 's' : ''}`,
    );

    const tags = collectTags(fullPosts);
    const tagCount = Object.keys(tags).length;
    if (tagCount > 0) {
      logger.info('blog-module', `Found ${tagCount} tag${tagCount !== 1 ? 's' : ''}`);
    }

    const tagsDropdown = generateTagsDropdown(tags);

    context.layoutData = { ...context.layoutData, tagsDropdown };

    await generateIntermediatePostHtmlFiles(
      fullPosts,
      config.templatePostsPath,
      config.tempPostsOutputDirectory,
    );

    await generatePaginatedBlogHtmlFiles(
      truncatedPosts,
      config.postsPerPage,
      config.templateBlogPath,
      config.tempBlogOutputPath,
    );

    await generateTagPages(
      tags,
      truncatedPosts,
      config.postsPerPage,
      config.templateMainTagsPath,
      config.tempTagsOutputDirectory,
    );

    await generateRssFeed(fullPosts, config);
    await generateSitemapFile(fullPosts, tags, config);
  },
};

const processAndSortMarkdownFiles = async (
  directory: string,
  options: { previewLength?: number; maxFileSize?: number } = {},
): Promise<Post[]> => {
  const posts = await processMarkdownFiles(directory, options);
  return posts
    .map((post): Post => {
      if (!post.title) {
        logger.warn('blog-module', `Post missing title: ${post.htmlFileName || 'unknown'}`);
      }
      if (!post.content) {
        logger.warn('blog-module', `Post missing content: ${post.htmlFileName || 'unknown'}`);
      }

      let postDate = new Date();
      if (post.date) {
        try {
          postDate = typeof post.date === 'string' ? parseDate(post.date) : new Date(post.date);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.warn(
            'blog-module',
            `Post has invalid date "${String(post.date)}" (${post.htmlFileName || 'unknown'}): ${err.message}. Using current date.`,
          );
        }
      }

      return {
        ...post,
        title: (post.title as string) || 'Untitled',
        date: postDate,
        tags: Array.isArray(post.tags) ? post.tags : [],
        content: (post.content as string) || '',
        previewContent: (post.previewContent as string) || '',
        htmlFileName: (post.htmlFileName as string) || '',
      } as Post;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

const collectTags = (posts: Post[]): Tags => {
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

const generateTagsDropdown = (tags: Tags): string => {
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

const generateRssFeed = async (posts: Post[], config: Config & BlogModuleConfig): Promise<void> => {
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
  logger.info('blog-module', 'Generated RSS feed -> rss.xml');
};

const generateSitemapFile = async (
  posts: Post[],
  tags: Tags,
  config: Config & BlogModuleConfig,
): Promise<void> => {
  const sitemapPath = path.join(config.publicContentOutputDirectory, 'sitemap.xml');
  const sitemapContent = generateSitemap(buildSitemapPages(posts, tags, config));
  await writeFileContent(sitemapPath, sitemapContent);
  logger.info('blog-module', 'Generated sitemap -> sitemap.xml');
};

const buildSitemapPages = (
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

const getBlogConfig = (config: Config): Config & BlogModuleConfig => {
  assertBlogConfig(config);
  return config as Config & BlogModuleConfig;
};

const assertBlogConfig = (config: Config): void => {
  const requiredStringKeys: Array<keyof BlogModuleConfig> = [
    'postsContentDirectory',
    'templatePostsPath',
    'templateBlogPath',
    'templateMainTagsPath',
    'tempPostsOutputDirectory',
    'tempTagsOutputDirectory',
    'tempBlogOutputPath',
    'publicBlogOutputPath',
    'publicPostsOutputDirectory',
    'publicTagsOutputDirectory',
  ];
  for (const key of requiredStringKeys) {
    const value = config[key];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Missing or invalid blog config key: ${String(key)}`);
    }
  }

  assertPositiveInteger(config.postsPerPage, 'postsPerPage');
  assertNonNegativeNumber(config.previewLength, 'previewLength');
  assertPositiveInteger(config.titleTruncationLength, 'titleTruncationLength');
  assertPositiveInteger(config.titleTruncationLengthBreadcrumb, 'titleTruncationLengthBreadcrumb');
  assertPositiveInteger(config.paginationWindowSize, 'paginationWindowSize');

  if (config.maxMarkdownFileSize !== undefined) {
    assertPositiveNumber(config.maxMarkdownFileSize, 'maxMarkdownFileSize');
  }
};

const assertPositiveInteger = (value: unknown, key: string): void => {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`Missing or invalid blog config key: ${key}`);
  }
};

const assertNonNegativeNumber = (value: unknown, key: string): void => {
  if (typeof value !== 'number' || value < 0) {
    throw new Error(`Missing or invalid blog config key: ${key}`);
  }
};

const assertPositiveNumber = (value: unknown, key: string): void => {
  if (typeof value !== 'number' || value < 1) {
    throw new Error(`Missing or invalid blog config key: ${key}`);
  }
};

export default blogModule;
