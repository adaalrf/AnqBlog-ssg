import type { Config } from '../../core/types/config.js';
import type { Module, ModuleContext } from '../../core/types/module.js';
import { logger } from '../../core/shared/logger.js';
import { generateIntermediatePostHtmlFiles } from './pipeline/posts.js';
import { generatePaginatedBlogHtmlFiles } from './pipeline/blog.js';
import { generateTagPages } from './pipeline/tags.js';
import { getBlogConfig, getBlogDirectoryPairs, validateBlogConfig } from './config.js';
import { writeBlogRss, writeBlogSitemap } from './domain/seo.js';
import { collectTags, renderTagsDropdown } from './domain/navigation.js';
import { processAndSortMarkdownFiles } from './domain/posts.js';

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

    const tagsDropdown = renderTagsDropdown(tags);

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

export default blogModule;
