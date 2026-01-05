import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import { marked } from 'marked';
import truncate from 'html-truncate';
import fs from 'fs';
import path from 'path';
import { readFileContent } from './path-and-file-utils.js';
import type { ProcessMarkdownOptions, InjectContentOptions, ParsedFrontMatter, ParsedMarkdown, Post } from '../types/index.js';

/**
 * Normalizes a tag for use in filenames (replaces spaces with dashes).
 * @param tag - The tag to normalize.
 * @returns The normalized tag for filenames.
 * @throws {Error} If tag is not a string.
 */
export const normalizeTagForFile = (tag: string): string => {
    if (typeof tag !== 'string') {
        throw new Error('Tag must be a string');
    }
    return tag.split(' ').join('-');
};

/**
 * Denormalizes a tag from a filename (replaces dashes with spaces).
 * @param tag - The tag to denormalize.
 * @returns The denormalized tag for display.
 * @throws {Error} If tag is not a string.
 */
export const denormalizeTagFromFile = (tag: string): string => {
    if (typeof tag !== 'string') {
        throw new Error('Tag must be a string');
    }
    return tag.split('-').join(' ');
};

/**
 * Gets the first N characters of HTML content while preserving structure.
 * For previews, removes headings and shows only paragraphs.
 * @param htmlContent - The HTML content.
 * @param length - The number of characters to truncate to.
 * @returns The truncated HTML content.
 * @throws {Error} If htmlContent is not a string or length is invalid.
 */
export const getFirstNthCharacters = (htmlContent: string, length: number = 250): string => {
    if (typeof htmlContent !== 'string') {
        throw new Error('HTML content must be a string');
    }
    if (typeof length !== 'number' || length < 0) {
        throw new Error('Length must be a non-negative number');
    }

    // For previews, remove headings to avoid showing partial headings
    if (length < Number.POSITIVE_INFINITY) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // Remove all headings (h1-h6) from preview
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading: Element) => {
            heading.remove();
        });

        // Get only the first paragraph for a clean preview (avoid code blocks and complex content)
        const paragraphs = Array.from(document.querySelectorAll('p')) as Element[];

        if (paragraphs.length > 0) {
            // Take only the first paragraph for a clean, simple preview
            const firstParagraph = paragraphs[0] as HTMLElement;
            const pText = firstParagraph.textContent || '';

            // If first paragraph is short enough, use it as-is
            if (pText.length <= length) {
                const previewHtml = firstParagraph.outerHTML.replace(/>\s+</g, '><').trim();
                return previewHtml;
            } else {
                // Truncate if too long
                const truncated = truncate(firstParagraph.outerHTML, length, { ellipsis: '...' });
                return truncated.replace(/>\s+</g, '><').trim();
            }
        }

        htmlContent = document.body.innerHTML;
    }

    return truncate(htmlContent, length, { ellipsis: '...' });
};

/**
 * Injects content into a template.
 * @param templateContent - The template content.
 * @param data - The data to inject.
 * @param options - Options for injecting tags.
 * @returns The DOM object with injected content.
 * @throws {Error} If templateContent is not a string or data is not an object.
 */
export const injectContentIntoTemplate = (
    templateContent: string,
    data: Record<string, unknown>,
    options: InjectContentOptions = {},
): JSDOM => {
    if (typeof templateContent !== 'string') {
        throw new Error('Template content must be a string');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Data must be an object');
    }
    const {
        tagWrapper = (tag: string) => `<a href="#">${tag}</a>`,
        tagsContainerSelector = '.tags',
        tagDividerSelector = '#post-tag-divider',
    } = options;

    const dom = new JSDOM(templateContent);
    const document = dom.window.document;

    // Replace placeholders
    Object.keys(data).forEach((key) => {
        const placeholder = new RegExp(`{{{${key}}}}`, 'g');
        const value = data[key];
        document.body.innerHTML = document.body.innerHTML.replace(
            placeholder,
            String(value),
        );
    });

    // Handle tags
    const tagsContainer = document.querySelector(tagsContainerSelector);
    const tagDivider = document.querySelector(tagDividerSelector);
    if (tagsContainer) {
        const tags = data.tags as string[] | undefined;
        if (tags && tags.length > 0) {
            const tagsList = tags.map(tagWrapper).join(' ');
            tagsContainer.innerHTML = tagsList;
        } else {
            tagsContainer.remove();
            if (tagDivider) tagDivider.remove();
        }
    }

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
 * Cleans up excessive whitespace in HTML content.
 * Preserves whitespace in preformatted elements (pre, code, textarea).
 * @param html - The HTML content.
 * @returns The cleaned HTML content.
 */
const cleanHtmlWhitespace = (html: string): string => {
    if (typeof html !== 'string') {
        return html;
    }

    return html
        // Remove excessive newlines (more than 2 consecutive)
        .replace(/\n{3,}/g, '\n\n')
        // Remove whitespace between HTML tags (but preserve in pre/code/textarea)
        // This regex matches > followed by whitespace followed by <
        .replace(/>\s+</g, '><')
        // Collapse multiple spaces/tabs to single space (but be careful with preformatted)
        .replace(/[ \t]+/g, ' ')
        // Trim each line
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        // Remove leading/trailing whitespace
        .trim();
};

/**
 * Parses and converts markdown to HTML.
 * @param fileContent - The markdown file content.
 * @returns The parsed data and HTML content.
 */
export const parseMarkdown = (fileContent: string): ParsedMarkdown => {
    if (typeof fileContent !== 'string') {
        throw new Error('File content must be a string');
    }
    try {
        const { data, content } = matter(fileContent);
        let htmlContent = marked(content || '') as string;
        // Clean up whitespace
        htmlContent = cleanHtmlWhitespace(htmlContent);
        return { data: data || {}, htmlContent };
    } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to parse markdown: ${err.message}`);
    }
};

/**
 * Processes markdown files in a directory.
 * @param directory - The directory containing markdown files.
 * @param options - Options for processing markdown files.
 * @returns An array of processed posts.
 * @throws {Error} If directory is not a string or options is not an object.
 */
export const processMarkdownFiles = (directory: string, options: ProcessMarkdownOptions = {}): Partial<Post>[] => {
    if (typeof directory !== 'string') {
        throw new Error('Directory must be a string');
    }
    if (options && (typeof options !== 'object' || Array.isArray(options))) {
        throw new Error('Options must be an object');
    }

    // Return empty array if directory doesn't exist (allows graceful handling for first-time setup)
    // Log a warning to help users identify configuration issues
    if (!fs.existsSync(directory)) {
        console.warn(`(Content-utils.ts): Directory does not exist: ${directory}. Returning empty array.`);
        return [];
    }

    const { previewLength = Number.POSITIVE_INFINITY } = options;
    const files = fs
        .readdirSync(directory)
        .filter((file) => file.endsWith('.md'));

    return files.map((file) => {
        const filePath = path.join(directory, file);
        const fileContent = readFileContent(filePath);
        const { data, htmlContent } = parseMarkdown(fileContent);

        // For preview content, remove the first H1 to avoid duplicate titles
        let previewHtml = htmlContent;
        if (previewLength < Number.POSITIVE_INFINITY) {
            const previewDom = new JSDOM(htmlContent);
            const previewDoc = previewDom.window.document;
            const firstH1 = previewDoc.querySelector('h1');
            if (firstH1) {
                firstH1.remove();
                previewHtml = previewDoc.body.innerHTML;
            }
        }

        return {
            ...data, // Include all front matter data
            htmlFileName: file.replace('.md', '.html'),
            content: htmlContent,
            previewContent: getFirstNthCharacters(previewHtml, previewLength),
        };
    });
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
    return template.replace(/{{(\w+)}}/g, (placeholder, key) => {
        let value = key in values ? values[key] : placeholder;
        // Strip newlines from page breadcrumb to prevent layout shifts
        if (key === 'page' && typeof value === 'string') {
            value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return String(value);
    });
};

/**
 * Escapes a value for use in YAML front matter.
 * @param value - The value to escape.
 * @returns The escaped value as a string.
 */
const escapeYamlValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '""';
    }
    if (typeof value !== 'string') {
        return JSON.stringify(value);
    }
    // Escape backslashes first, then quotes, then newlines
    return `"${value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')}"`;
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param text - The text to escape.
 * @returns The escaped text safe for HTML insertion.
 */
export const escapeHtml = (text: string): string => {
    if (typeof text !== 'string') {
        return '';
    }
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Truncates plain text to a specified length.
 * @param text - The text to truncate.
 * @param length - The maximum length.
 * @returns The truncated text.
 */
export const truncateText = (text: string, length: number = 50): string => {
    if (typeof text !== 'string') {
        return '';
    }
    if (text.length <= length) {
        return text;
    }
    return text.substring(0, length).trim() + '...';
};

/**
 * Generates front matter string from a data object and additional options.
 * @param data - The metadata object.
 * @param options - Additional options to include in the front matter.
 * @returns The front matter string.
 */
export const generateFrontMatter = (data: Record<string, unknown>, options: Record<string, unknown> = {}): string => {
    const mergedData = { ...data, ...options };
    return `---\n${Object.entries(mergedData)
        .map(([key, value]) => `${key}: ${escapeYamlValue(value)}`)
        .join('\n')}\n---`;
};

