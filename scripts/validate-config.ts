import fs from 'fs';
import config from './config.js';
import { getListingTemplatePath } from './utils/template-utils.js';
import type { Config, PathConfig } from './types/config.js';

/**
 * Validates the site configuration and path configuration.
 * Throws an error if any required fields are missing or invalid.
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(): void {
  const errors: string[] = [];
  const cfg = config as Config;

  // Validate required site config
  if (!cfg.siteName || typeof cfg.siteName !== 'string' || !cfg.siteName.trim()) {
    errors.push('siteName is required and cannot be empty');
  }

  if (!cfg.siteDescription || typeof cfg.siteDescription !== 'string') {
    errors.push('siteDescription is required');
  }

  if (!cfg.siteUrl || typeof cfg.siteUrl !== 'string' || !cfg.siteUrl.trim()) {
    errors.push('siteUrl is required');
  } else {
    try {
      new URL(cfg.siteUrl);
    } catch {
      errors.push(`siteUrl must be a valid URL: ${cfg.siteUrl}`);
    }
  }

  // Validate numeric configs
  if (!Number.isInteger(cfg.postsPerPage) || cfg.postsPerPage < 1) {
    errors.push(`postsPerPage must be a positive integer, got: ${cfg.postsPerPage}`);
  }

  if (typeof cfg.previewLength !== 'number' || cfg.previewLength < 0) {
    errors.push(`previewLength must be a non-negative number, got: ${cfg.previewLength}`);
  }

  if (!Number.isInteger(cfg.titleTruncationLength) || cfg.titleTruncationLength < 1) {
    errors.push(`titleTruncationLength must be a positive integer, got: ${cfg.titleTruncationLength}`);
  }

  if (!Number.isInteger(cfg.titleTruncationLengthBreadcrumb) || cfg.titleTruncationLengthBreadcrumb < 1) {
    errors.push(`titleTruncationLengthBreadcrumb must be a positive integer, got: ${cfg.titleTruncationLengthBreadcrumb}`);
  }

  if (!Number.isInteger(cfg.paginationWindowSize) || cfg.paginationWindowSize < 1) {
    errors.push(`paginationWindowSize must be a positive integer, got: ${cfg.paginationWindowSize}`);
  }

  // Validate locale and language
  if (!cfg.dateLocale || typeof cfg.dateLocale !== 'string') {
    errors.push('dateLocale is required');
  }

  if (!cfg.siteLanguage || typeof cfg.siteLanguage !== 'string') {
    errors.push('siteLanguage is required');
  }

  // Validate required paths exist
  // Note: templateBlogPath and templateTagsPath are not required as the code uses listing-template.html
  const requiredPaths: (keyof PathConfig)[] = [
    'postsContentDirectory',
    'mainLayoutPath',
    'templatePostsPath',
    'templateMainTagsPath',
    'inputCSS',
  ];

  for (const pathKey of requiredPaths) {
    const pathValue = cfg[pathKey];
    if (!pathValue || typeof pathValue !== 'string') {
      errors.push(`${pathKey} is required in pathConfig`);
    } else if (!fs.existsSync(pathValue)) {
      errors.push(`${pathKey} path does not exist: ${pathValue}`);
    }
  }

  // Validate listing template exists (used by blog and tags)
  const listingTemplatePath = getListingTemplatePath();
  if (!fs.existsSync(listingTemplatePath)) {
    errors.push(`listing template path does not exist: ${listingTemplatePath}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

