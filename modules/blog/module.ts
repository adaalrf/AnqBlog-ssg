import type { Config } from '../../core/types/config.js';
import type { Module, ModuleContext } from '../../core/types/module.js';
import { logger } from '../../core/shared/logger.js';
import { parseDate } from '../../core/shared/date-utils.js';
import {
  denormalizeTagFromFile,
  escapeHtml,
  getTagSlug,
  processMarkdownFiles,
} from './utils/content-utils.js';
import { generateIntermediatePostHtmlFiles } from './pipeline/posts.js';
import { generatePaginatedBlogHtmlFiles } from './pipeline/blog.js';
import { generateTagPages } from './pipeline/tags.js';
import type { Post, Tags } from './types.js';
import { getBlogConfig, getBlogDirectoryPairs, validateBlogConfig } from './config.js';
import { writeBlogRss, writeBlogSitemap } from './domain/seo.js';

const blogModule: Module = {
  name: 'blog',
  validate: (config: Config): void => {
    validateBlogConfig(config);
  },
  directoryPairs: getBlogDirectoryPairs,
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

    context.ui.setSlot('tagsDropdown', tagsDropdown);

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

    await writeBlogRss(fullPosts, config);
    logger.info('blog-module', 'Generated RSS feed -> rss.xml');

    await writeBlogSitemap(fullPosts, tags, config);
    logger.info('blog-module', 'Generated sitemap -> sitemap.xml');
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

export default blogModule;
