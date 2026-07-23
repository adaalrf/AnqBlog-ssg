import { parseDate } from '../../../core/shared/date-utils.js';
import { logger } from '../../../core/shared/logger.js';
import { processMarkdownFiles } from '../utils/content-utils.js';
import type { Post } from '../types.js';

type PostInput = Omit<
  Partial<Post>,
  'date' | 'title' | 'tags' | 'content' | 'previewContent' | 'htmlFileName'
> & {
  date?: string | number | Date;
  title?: unknown;
  tags?: unknown;
  content?: unknown;
  previewContent?: unknown;
  htmlFileName?: unknown;
};

export const normalizeAndSortPosts = (posts: PostInput[]): Post[] => {
  return posts
    .map((post): Post => {
      const fileName =
        typeof post.htmlFileName === 'string' && post.htmlFileName ? post.htmlFileName : 'unknown';
      const title = typeof post.title === 'string' && post.title ? post.title : 'Untitled';
      const content = typeof post.content === 'string' ? post.content : '';
      const previewContent = typeof post.previewContent === 'string' ? post.previewContent : '';
      const tags =
        Array.isArray(post.tags) && post.tags.length > 0
          ? post.tags.map((tag) => (typeof tag === 'string' ? tag : String(tag)))
          : [];

      if (title === 'Untitled') {
        logger.warn('blog-module', `Post missing title: ${fileName}`);
      }
      if (!content) {
        logger.warn('blog-module', `Post missing content: ${fileName}`);
      }

      let postDate = new Date();
      if (post.date) {
        try {
          if (typeof post.date === 'string') {
            postDate = parseDate(post.date);
          } else {
            postDate = new Date(post.date);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.warn(
            'blog-module',
            `Post has invalid date "${String(post.date)}" (${fileName}): ${err.message}. Using current date.`,
          );
        }
      }

      return {
        ...post,
        title,
        date: postDate,
        tags,
        content,
        previewContent,
        htmlFileName: typeof post.htmlFileName === 'string' ? post.htmlFileName : '',
      } as Post;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const processAndSortMarkdownFiles = async (
  directory: string,
  options: { previewLength?: number; maxFileSize?: number } = {},
): Promise<Post[]> => {
  const posts = await processMarkdownFiles(directory, options);
  return normalizeAndSortPosts(posts);
};
