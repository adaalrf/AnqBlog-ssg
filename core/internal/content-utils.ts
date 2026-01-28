import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import type { ParsedFrontMatter } from '../types/index.js';

/**
 * Injects content into a template.
 * @param templateContent - The template content.
 * @param data - The data to inject.
 * @returns The DOM object with injected content.
 * @throws {Error} If templateContent is not a string or data is not an object.
 */
export const injectContentIntoTemplate = (
  templateContent: string,
  data: Record<string, unknown>,
): JSDOM => {
  if (typeof templateContent !== 'string') {
    throw new Error('Template content must be a string');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Data must be an object');
  }

  const dom = new JSDOM(templateContent);
  const document = dom.window.document;

  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`{{{${key}}}}`, 'g');
    const value = data[key];
    document.body.innerHTML = document.body.innerHTML.replace(placeholder, String(value));
  });

  return dom;
};

/**
 * Parses front matter from HTML files.
 * @param fileContent - The HTML file content.
 * @returns The parsed data and HTML content.
 */
export const parseHtmlFrontMatter = (fileContent: string): ParsedFrontMatter => {
  if (typeof fileContent !== 'string') {
    throw new Error('File content must be a string');
  }
  try {
    const { data, content } = matter(fileContent);
    return { data: data || {}, content: content || '' };
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to parse front matter: ${err.message}`);
  }
};

/**
 * Replaces placeholders in a template with corresponding values.
 * @param template - The template content.
 * @param values - The values to replace the placeholders with.
 * @returns The template with placeholders replaced.
 * @throws {Error} If template is not a string or values is not an object.
 */
export const replacePlaceholders = (template: string, values: Record<string, unknown>): string => {
  if (typeof template !== 'string') {
    throw new Error('Template must be a string');
  }
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('Values must be an object');
  }
  return template.replace(/{{(\w+)}}/g, (placeholder, key: string) => {
    const value = key in values ? values[key] : placeholder;
    if (key === 'page' && typeof value === 'string') {
      const cleanedValue = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return cleanedValue;
    }
    return String(value);
  });
};
