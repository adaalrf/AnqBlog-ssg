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

/**
 * Type guard to validate front matter data structure.
 * @param data - The data to validate.
 * @returns True if data is a valid object (not null/undefined).
 */
export function isValidFrontMatterData(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

/**
 * Type guard to validate that a value is a string array.
 * @param value - The value to validate.
 * @returns True if value is a string array.
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Tags object mapping tag names to arrays of posts.
 */
export type Tags = Record<string, Post[]>;
