import fs from 'fs';
import config from './config.js';
import type { Config, PathConfig } from '../types/config.js';

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
    errors.push(
      `titleTruncationLength must be a positive integer, got: ${cfg.titleTruncationLength}`,
    );
  }

  if (
    !Number.isInteger(cfg.titleTruncationLengthBreadcrumb) ||
    cfg.titleTruncationLengthBreadcrumb < 1
  ) {
    errors.push(
      `titleTruncationLengthBreadcrumb must be a positive integer, got: ${cfg.titleTruncationLengthBreadcrumb}`,
    );
  }

  if (!Number.isInteger(cfg.paginationWindowSize) || cfg.paginationWindowSize < 1) {
    errors.push(
      `paginationWindowSize must be a positive integer, got: ${cfg.paginationWindowSize}`,
    );
  }

  // Validate maxMarkdownFileSize if provided
  if (cfg.maxMarkdownFileSize !== undefined) {
    if (typeof cfg.maxMarkdownFileSize !== 'number' || cfg.maxMarkdownFileSize < 1) {
      errors.push(`maxMarkdownFileSize must be a positive number, got: ${cfg.maxMarkdownFileSize}`);
    }
  }

  // Validate locale and language
  if (!cfg.dateLocale || typeof cfg.dateLocale !== 'string') {
    errors.push('dateLocale is required');
  }

  if (!cfg.siteLanguage || typeof cfg.siteLanguage !== 'string') {
    errors.push('siteLanguage is required');
  }

  // Validate module list
  if (cfg.modules !== undefined) {
    if (!Array.isArray(cfg.modules)) {
      errors.push('modules must be an array of module names');
    } else {
      cfg.modules.forEach((moduleName) => {
        if (!moduleName || typeof moduleName !== 'string') {
          errors.push(`module name must be a non-empty string, got: ${String(moduleName)}`);
        }
      });
    }
  }

  // Validate optional URL fields
  if (cfg.githubUrl && typeof cfg.githubUrl === 'string') {
    try {
      new URL(cfg.githubUrl);
    } catch {
      errors.push(`githubUrl must be a valid URL: ${cfg.githubUrl}`);
    }
  }

  // Validate optional string fields
  if (cfg.authorName && typeof cfg.authorName !== 'string') {
    errors.push('authorName must be a string if provided');
  }

  // Validate copyright year is reasonable
  if (typeof cfg.copyrightYear === 'number') {
    const currentYear = new Date().getFullYear();
    if (cfg.copyrightYear < 2000 || cfg.copyrightYear > currentYear + 1) {
      errors.push(
        `copyrightYear seems invalid: ${cfg.copyrightYear} (expected between 2000 and ${currentYear + 1})`,
      );
    }
  }

  // Validate required core paths exist
  const requiredPaths: (keyof PathConfig)[] = [
    'contentDirectory',
    'mainLayoutPath',
    'template404Path',
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

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
}
