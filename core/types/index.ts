/**
 * Core type definitions for the static site generator.
 */

/**
 * Parsed front matter result.
 */
export interface ParsedFrontMatter {
  data: Record<string, unknown>;
  content: string;
}
