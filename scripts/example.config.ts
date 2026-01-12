import { fpr } from './utils/path-and-file-utils.js';
import type { SiteConfig, PathConfig, Config } from './types/config.js';

/**
 * Example configuration file for the static site generator.
 *
 * Copy this file to `scripts/config.ts` and customize the values for your site.
 * The `config.ts` file is gitignored and should contain your site-specific settings.
 */
const siteConfig: SiteConfig = {
  siteName: 'My Blog', // Site name displayed in header
  siteDescription: 'My awesome blog', // Site description for meta tags
  siteUrl: 'https://example.com', // Base URL (used for canonical URLs and Open Graph)
  githubUrl: 'https://github.com/username', // GitHub profile URL
  authorName: 'username', // Author name displayed in footer
  copyrightYear: new Date().getFullYear(), // Copyright year (auto-updates)
  postsPerPage: 5, // Number of posts per paginated page
  previewLength: 200, // Character length for post previews
  titleTruncationLength: 25, // Max title length in post listings
  titleTruncationLengthBreadcrumb: 20, // Max title length in breadcrumbs
  paginationWindowSize: 5, // Number of page links in pagination
  dateLocale: 'en-US', // Locale for date formatting (e.g., 'en-US', 'en-GB', 'de-DE', 'fr-FR')
  siteLanguage: 'en', // HTML lang attribute (e.g., 'en', 'es', 'fr', 'de')
  maxMarkdownFileSize: 5 * 1024 * 1024, // Maximum markdown file size in bytes (default: 5MB)
};

/**
 * Path configuration settings for the static site generator.
 */
const pathConfig: PathConfig = {
  inputCSS: fpr('src/styles/tailwind.css'),
  outputCSS: fpr('public/styles/styles.css'),
  contentDirectory: fpr('src/content'),
  postsContentDirectory: fpr('src/content/blog/posts'),
  templatePostsPath: fpr('src/templates/post-template.html'),
  templateBlogPath: fpr('src/templates/listing-template.html'),
  templateMainTagsPath: fpr('src/templates/main-tags-template.html'),
  template404Path: fpr('src/templates/404-template.html'),
  mainLayoutPath: fpr('src/templates/layout-template.html'),
  tempPostsOutputDirectory: fpr('.build/blog/posts'),
  tempTagsOutputDirectory: fpr('.build/blog/tags'),
  tempBlogOutputPath: fpr('.build/blog'),
  publicContentOutputDirectory: fpr('public'),
  publicBlogOutputPath: fpr('public/blog'),
  publicPostsOutputDirectory: fpr('public/blog/posts'),
  publicTagsOutputDirectory: fpr('public/blog/tags'),
};

/**
 * Exports the combined configuration settings.
 */
const config = {
  ...siteConfig,
  ...pathConfig,
} satisfies Config;

export default config;
