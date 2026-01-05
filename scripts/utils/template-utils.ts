import { fpr } from './path-and-file-utils.js';

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

