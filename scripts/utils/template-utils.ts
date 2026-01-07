import { fpr, readFileContent } from './path-and-file-utils.js';
import fsPromises from 'fs/promises';

/**
 * Template cache to avoid reading templates multiple times.
 * Uses file modification time to invalidate cache when templates change.
 */
interface CachedTemplate {
  content: string;
  mtime: number;
}

const templateCache = new Map<string, CachedTemplate>();

/**
 * Gets the path to a template file by name.
 * @param templateName - The name of the template (e.g., 'post', 'blog', 'tags').
 * @returns The absolute path to the template file.
 */
export function getTemplatePath(templateName: string): string {
  return fpr(`src/templates/${templateName}-template.html`);
}

/**
 * Gets the path to the shared listing template used by blog and tag pages.
 * @returns The absolute path to the listing template file.
 */
export function getListingTemplatePath(): string {
  return fpr('src/templates/listing-template.html');
}

/**
 * Reads a template file with caching based on file modification time.
 * Cache is invalidated if the file is modified.
 * @param templatePath - The absolute path to the template file.
 * @returns Promise that resolves to the template content.
 */
export async function getCachedTemplate(templatePath: string): Promise<string> {
  // Check if we have a cached version
  const cached = templateCache.get(templatePath);

  try {
    const stats = await fsPromises.stat(templatePath);
    const currentMtime = stats.mtimeMs;

    // If cache exists and file hasn't changed, return cached content
    if (cached && cached.mtime === currentMtime) {
      return cached.content;
    }

    // Read and cache the template
    const content = await readFileContent(templatePath);
    templateCache.set(templatePath, {
      content,
      mtime: currentMtime,
    });

    return content;
  } catch (error) {
    // If file doesn't exist or can't be read, clear cache and throw
    templateCache.delete(templatePath);
    throw error;
  }
}

/**
 * Clears the template cache. Useful for testing or when templates are modified externally.
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
