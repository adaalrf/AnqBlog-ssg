import fsPromises from 'fs/promises';
import path from 'path';
import config from './config.js';
import {
  replacePlaceholders,
  injectContentIntoTemplate,
  parseHtmlFrontMatter,
  denormalizeTagFromFile,
  getTagSlug,
} from './utils/content-utils.js';
import {
  fpr,
  readFileContent,
  ensureDirectoryExists,
  writeFileContent,
} from './utils/path-and-file-utils.js';
import { minifyHtml } from './utils/html-minify.js';
import { logger } from './utils/logger.js';
import type { Tags } from './types/index.js';

/**
 * Directory pair for input and output.
 */
interface DirectoryPair {
  inputDir: string;
  outputDir: string;
}

/**
 * Template cache for storing loaded templates.
 */
interface TemplateCache {
  mainLayout: string | null;
  specificTemplates: Record<string, string>;
}

/**
 * Generates the tags dropdown HTML.
 * @param tags - The tags object.
 * @param currentFilePath - The current file path.
 * @returns The generated tags dropdown HTML.
 */
const generateTagsDropdown = (tags: Tags, currentFilePath: string): string => {
  if (!currentFilePath) {
    logger.error('apply-layout.ts', 'Error: currentFilePath is undefined');
    return '';
  }

  // Use absolute paths from site root for consistency
  return Object.keys(tags)
    .map((tag) => {
      const filesWithDash = getTagSlug(tag);
      const filesWithoutDash = denormalizeTagFromFile(tag);
      return `<li><a href="/blog/tags/${filesWithDash}.html" class="dropdown-item">${filesWithoutDash}</a></li>`;
    })
    .join('\n');
};

/**
 * Applies the main layout to all HTML files in multiple directories.
 * @param directoryPairs - Array of directory pairs (input and output).
 * @param tags - Tags object.
 * @throws {Error} If template files cannot be read, required elements are missing, or file writing fails.
 */
export const applyLayoutToHtmlFiles = async (
  directoryPairs: DirectoryPair[],
  tags: Tags,
): Promise<void> => {
  const processedDirs = new Set<string>();
  // Cache templates to avoid reading them multiple times
  const templateCache: TemplateCache = {
    mainLayout: null,
    specificTemplates: {},
  };

  for (const { inputDir, outputDir } of directoryPairs) {
    await processDirectory(inputDir, outputDir, tags, processedDirs, templateCache);
  }
};

/**
 * Processes a single directory to apply the main layout to HTML files.
 * Recursively processes subdirectories and applies templates to HTML files.
 * @param inputDir - The input directory to process.
 * @param outputDir - The output directory for processed files.
 * @param tags - Tags object for generating dropdowns.
 * @param processedDirs - Set of already processed directories to avoid duplicates.
 * @param templateCache - Cache object for storing template content.
 */
const processDirectory = async (
  inputDir: string,
  outputDir: string,
  tags: Tags,
  processedDirs: Set<string>,
  templateCache: TemplateCache,
): Promise<void> => {
  if (processedDirs.has(inputDir)) {
    return;
  }
  processedDirs.add(inputDir);

  // Skip if directory doesn't exist
  try {
    await fsPromises.access(inputDir);
  } catch {
    return;
  }

  const files = await fsPromises.readdir(inputDir);

  for (const file of files) {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);

    if (file === 'posts') {
      continue;
    }

    const stats = await fsPromises.stat(inputFilePath);
    if (stats.isDirectory()) {
      ensureDirectoryExists(outputFilePath);
      await processDirectory(inputFilePath, outputFilePath, tags, processedDirs, templateCache);
    } else if (file.endsWith('.html')) {
      const fileContent = await readFileContent(inputFilePath);
      const { data, content } = parseHtmlFrontMatter(fileContent);

      const templateFilePath = path.join(
        fpr('src/templates'),
        `${path.basename(file, '.html')}-template.html`,
      );

      let specificTemplateExists = false;
      try {
        await fsPromises.access(templateFilePath);
        specificTemplateExists = true;
      } catch {
        // Template doesn't exist
      }

      // If a specific template exists, inject the content into it
      let mainContent: string;
      if (specificTemplateExists) {
        // Cache specific templates
        if (!templateCache.specificTemplates[templateFilePath]) {
          templateCache.specificTemplates[templateFilePath] =
            await readFileContent(templateFilePath);
        }
        const templateContent = templateCache.specificTemplates[templateFilePath];
        const dom = injectContentIntoTemplate(templateContent, {
          ...data,
          content,
        });
        const bodyElement = dom.window.document.querySelector('body');
        if (!bodyElement) {
          throw new Error(`Template missing body element: ${templateFilePath}`);
        }
        mainContent = bodyElement.innerHTML;
        // Else, apply the main layout to the content
      } else {
        mainContent = content;
      }

      // All assets are at the site root, use absolute paths from root
      const tagsDropdownContent = generateTagsDropdown(tags, outputFilePath);
      // Cache main layout template
      if (!templateCache.mainLayout) {
        templateCache.mainLayout = await readFileContent(config.mainLayoutPath);
      }
      const mainLayoutContent = templateCache.mainLayout;

      const finalTitle = `${config.siteName} | ${(data.title as string) || ''}`;

      // Generate canonical URL and Open Graph URL from file path
      // Convert file path relative to public directory to URL path
      const publicDir = config.publicContentOutputDirectory;
      let relativePath = path.relative(publicDir, outputFilePath);
      // Normalize path separators
      relativePath = relativePath.replace(/\\/g, '/');
      // Remove index.html and .html extension, but keep directory structure
      if (relativePath.endsWith('/index.html')) {
        relativePath = relativePath.replace(/\/index\.html$/, '');
      } else if (relativePath.endsWith('.html')) {
        relativePath = relativePath.replace(/\.html$/, '');
      }
      // Ensure it starts with /
      const urlPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      // If empty or just '/', use base URL, otherwise append path
      const canonicalUrl = urlPath === '/' ? config.siteUrl : config.siteUrl + urlPath;
      const ogUrl = canonicalUrl;

      // Determine og:type based on page type (article for posts, website for others)
      // Check if this is a post page by looking at the path
      const isPostPage =
        relativePath.includes('/blog/posts/') && !relativePath.endsWith('/blog/posts');
      const ogType = isPostPage ? 'article' : 'website';

      // Replace placeholders in the main layout - all assets are at root
      // Provide defaults for missing fields
      let finalHtml = replacePlaceholders(mainLayoutContent, {
        ...data,
        title: finalTitle,
        page: (data.page as string) || '', // Default to empty if not provided
        children: mainContent,
        tagsDropdown: tagsDropdownContent,
        siteName: config.siteName || '',
        siteDescription: config.siteDescription || '',
        githubUrl: config.githubUrl || '',
        authorName: config.authorName || '',
        copyrightYear: config.copyrightYear || new Date().getFullYear(),
        siteLanguage: config.siteLanguage || 'en',
        canonicalUrl: canonicalUrl,
        ogUrl: ogUrl,
        ogType: ogType,
        stylesPath: '/styles/styles.css',
        faviconPath: '/assets/favicon.ico',
        scriptPath: '/js/bundle.js',
        gitLogoPath: '/assets/github-icon.svg',
      });

      // Minify HTML for smaller file sizes
      finalHtml = minifyHtml(finalHtml);

      await writeFileContent(outputFilePath, finalHtml);
      logger.info('apply-layout.ts', `Processed page -> ${outputFilePath}`);
    }
  }
};
