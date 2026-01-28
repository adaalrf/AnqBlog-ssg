/**
 * Blog module type definitions.
 */

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
