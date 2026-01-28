/**
 * Minification options for HTML minification.
 */
interface MinifyOptions {
  removeComments?: boolean;
  collapseWhitespace?: boolean;
}

/**
 * Minifies HTML by removing unnecessary whitespace and comments.
 * Preserves whitespace in preformatted elements (pre, code, textarea, script, style).
 * @param html - The HTML content to minify.
 * @param options - Minification options.
 * @returns The minified HTML content.
 */
export const minifyHtml = (html: string, options: MinifyOptions = {}): string => {
  if (typeof html !== 'string') {
    return html;
  }

  const { removeComments = true, collapseWhitespace = true } = options;

  // Elements that preserve whitespace and should not be minified
  // Order matters: process outer containers first (pre, textarea) before inner ones (code)
  const preserveWhitespaceTags = ['pre', 'textarea', 'script', 'style', 'code'];
  const preservedBlocks: string[] = [];
  let placeholderIndex = 0;

  // Extract and preserve preformatted content
  let processedHtml = html;
  preserveWhitespaceTags.forEach((tag) => {
    // Match both opening and closing tags, handling attributes
    // Use non-greedy matching to handle nested tags correctly
    const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    processedHtml = processedHtml.replace(regex, (match) => {
      const placeholder = `__PRESERVED_BLOCK_${placeholderIndex}__`;
      preservedBlocks[placeholderIndex] = match; // Store the entire block with original formatting
      placeholderIndex++;
      return placeholder;
    });
  });

  let minified = processedHtml;

  // Remove HTML comments (but preserve conditional comments for IE)
  if (removeComments) {
    minified = minified.replace(/<!--(?!\s*(?:\[if [^\]]+]|<!|>))(?:(?!-->)(.|\n))*-->/g, '');
  }

  // Collapse whitespace between tags
  if (collapseWhitespace) {
    // Remove whitespace between tags
    minified = minified.replace(/>\s+</g, '><');

    // Collapse multiple spaces/tabs/newlines to single space (outside preserved blocks)
    minified = minified.replace(/[ \t]+/g, ' ');

    // Remove leading/trailing whitespace from lines
    minified = minified.replace(/^\s+|\s+$/gm, '');
  }

  // Restore preserved blocks with their original formatting
  preservedBlocks.forEach((block, index) => {
    minified = minified.replace(`__PRESERVED_BLOCK_${index}__`, block);
  });

  return minified.trim();
};
