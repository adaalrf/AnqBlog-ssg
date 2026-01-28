import config from '../config/config.js';
import { logger } from '../shared/logger.js';

/**
 * Configuration for robots.txt generation.
 */
export interface RobotsConfig {
  /**
   * Whether to allow all crawlers (default: true).
   * If false, all crawlers are disallowed.
   */
  allowAll?: boolean;
  /**
   * Array of paths to disallow (e.g., ['/admin', '/private']).
   */
  disallowPaths?: string[];
  /**
   * Array of paths to allow (useful when allowAll is false).
   */
  allowPaths?: string[];
  /**
   * Whether to include sitemap URL (default: true).
   */
  includeSitemap?: boolean;
  /**
   * Custom user-agent rules (optional).
   * Example: { 'Googlebot': { allow: ['/'], disallow: ['/private'] } }
   */
  userAgents?: Record<string, { allow?: string[]; disallow?: string[] }>;
}

/**
 * Generates a robots.txt file content.
 * @param robotsConfig - Optional configuration for robots.txt rules.
 * @returns The robots.txt content as a string.
 */
export function generateRobotsTxt(robotsConfig: RobotsConfig = {}): string {
  const {
    allowAll = true,
    disallowPaths = [],
    allowPaths = [],
    includeSitemap = true,
    userAgents = {},
  } = robotsConfig;

  const lines: string[] = [];

  // If custom user-agent rules exist, use them
  if (Object.keys(userAgents).length > 0) {
    for (const [userAgent, rules] of Object.entries(userAgents)) {
      lines.push(`User-agent: ${userAgent}`);
      if (rules.allow) {
        rules.allow.forEach((path) => {
          lines.push(`Allow: ${path}`);
        });
      }
      if (rules.disallow) {
        rules.disallow.forEach((path) => {
          lines.push(`Disallow: ${path}`);
        });
      }
      lines.push(''); // Empty line between user-agent blocks
    }
  }

  // Default rules for all user agents (only if '*' is not already in userAgents)
  if (!Object.prototype.hasOwnProperty.call(userAgents, '*')) {
    lines.push('User-agent: *');

    if (!allowAll) {
      // If not allowing all, disallow everything first
      lines.push('Disallow: /');
      // Then allow specific paths
      allowPaths.forEach((path) => {
        lines.push(`Allow: ${path}`);
      });
    } else {
      // If allowing all, just disallow specific paths
      disallowPaths.forEach((path) => {
        lines.push(`Disallow: ${path}`);
      });
    }
  }

  // Add sitemap reference
  if (includeSitemap) {
    if (config.siteUrl && typeof config.siteUrl === 'string' && config.siteUrl.trim()) {
      // Normalize siteUrl: trim whitespace and remove trailing slashes
      const normalizedSiteUrl = config.siteUrl.trim().replace(/\/+$/, '');
      lines.push('');
      lines.push(`Sitemap: ${normalizedSiteUrl}/sitemap.xml`);
    } else {
      logger.warn(
        'generate-robots.ts',
        'Skipping sitemap reference: siteUrl is missing or invalid',
      );
    }
  }

  return lines.join('\n') + '\n';
}
