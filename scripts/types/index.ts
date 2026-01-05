/**
 * Core type definitions for the static site generator.
 * 
 * This module exports all shared types used throughout the build system,
 * including post data structures, processing options, and content utilities.
 */

/**
 * Options for processing markdown files.
 */
export interface ProcessMarkdownOptions {
  previewLength?: number;
}

/**
 * Options for injecting content into templates.
 */
export interface InjectContentOptions {
  tagWrapper?: (tag: string) => string;
  tagsContainerSelector?: string;
  tagDividerSelector?: string;
}

/**
 * Front matter data from markdown files.
 */
export interface FrontMatterData {
  title?: string;
  date?: string;
  tags?: string[];
  [key: string]: unknown;
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
  [key: string]: unknown; // Allow other front matter fields
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

