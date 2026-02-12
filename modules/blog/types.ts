/**
 * Blog module type definitions.
 */

/**
 * Blog module site configuration settings.
 */
export interface BlogSiteConfig {
  postsPerPage: number;
  previewLength: number;
  titleTruncationLength: number;
  titleTruncationLengthBreadcrumb: number;
  paginationWindowSize: number;
  maxMarkdownFileSize?: number; // Maximum file size in bytes (default: 5MB)
}

/**
 * Blog module path configuration settings.
 */
export interface BlogPathConfig {
  postsContentDirectory: string;
  templatePostsPath: string;
  templateBlogPath: string;
  templateMainTagsPath: string;
  tempPostsOutputDirectory: string;
  tempTagsOutputDirectory: string;
  tempBlogOutputPath: string;
  publicBlogOutputPath: string;
  publicPostsOutputDirectory: string;
  publicTagsOutputDirectory: string;
}

/**
 * Blog module combined config settings.
 */
export type BlogModuleConfig = BlogSiteConfig & BlogPathConfig;

/**
 * Options for processing markdown files.
 */
export interface ProcessMarkdownOptions {
  previewLength?: number;
}

/**
 * Processed post object with all required fields.
 */
export interface Post {
  title: string;
  date: Date;
  tags: string[];
  content: string;
  previewContent: string;
  htmlFileName: string;
  [key: string]: unknown;
}

/**
 * Parsed front matter result.
 */
export interface ParsedFrontMatter {
  data: Record<string, unknown>;
  content: string;
}

/**
 * Parsed markdown result.
 */
export interface ParsedMarkdown {
  data: Record<string, unknown>;
  htmlContent: string;
}

/**
 * Tags object mapping tag names to arrays of posts.
 */
export type Tags = Record<string, Post[]>;
