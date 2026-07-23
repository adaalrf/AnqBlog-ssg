import { fpr } from '../shared/path-and-file-utils.js';
import type {
  Config,
  CorePathConfig,
  CoreSiteConfig,
  ModuleConfig,
  ThemeConfig,
} from '../types/config.js';
import type { BlogModuleConfig } from '../../modules/blog/types.js';

/**
 * Site configuration settings for the static site generator.
 */
const coreSiteConfig: CoreSiteConfig = {
  siteName: 'Anq Blog',
  siteDescription: 'A Markdown-powered static site generator for pages and blog posts.',
  siteUrl: 'https://example.com', // Domain or subdomain root used for canonical and Open Graph URLs
  githubUrl: 'https://github.com/yourname',
  authorName: 'Your Name', // Author name displayed in footer
  copyrightYear: new Date().getFullYear(),
  dateLocale: 'en-US', // Locale for date formatting (e.g., 'en-US', 'en-GB', 'de-DE', 'fr-FR')
  siteLanguage: 'en', // HTML lang attribute (e.g., 'en', 'es', 'fr', 'de')
};

/**
 * Path configuration settings for the static site generator.
 */
const corePathConfig: CorePathConfig = {
  inputCSS: fpr('styles/tailwind.css'),
  outputCSS: fpr('public/styles/styles.css'),
  contentDirectory: fpr('content/pages'),
  template404Path: fpr('templates/404-template.html'),
  mainLayoutPath: fpr('templates/layout-template.html'),
  publicContentOutputDirectory: fpr('public'),
};

/**
 * Theme configuration settings for the static site generator.
 */
const themeConfig: ThemeConfig = {
  themes: ['dark', 'light', 'rose', 'mono'],
  defaultTheme: 'dark',
};

/**
 * Module configuration settings.
 */
const moduleConfig: ModuleConfig = {
  modules: ['blog'],
};

/**
 * Module-specific extension settings (blog currently enabled).
 */
const blogModuleConfig: BlogModuleConfig = {
  postsPerPage: 5,
  previewLength: 200, // Character length for post previews
  titleTruncationLength: 25, // Character length for truncated titles in post items
  titleTruncationLengthBreadcrumb: 20, // Character length for truncated titles in breadcrumbs
  paginationWindowSize: 5, // Number of page links to show in pagination
  maxMarkdownFileSize: 5 * 1024 * 1024, // Maximum markdown file size in bytes (default: 5MB)
  postsContentDirectory: fpr('content/blog/posts'),
  templatePostsPath: fpr('templates/post-template.html'),
  templateBlogPath: fpr('templates/listing-template.html'),
  templateMainTagsPath: fpr('templates/main-tags-template.html'),
  tempPostsOutputDirectory: fpr('.build/blog/posts'),
  tempTagsOutputDirectory: fpr('.build/blog/tags'),
  tempBlogOutputPath: fpr('.build/blog'),
  publicBlogOutputPath: fpr('public/blog'),
  publicPostsOutputDirectory: fpr('public/blog/posts'),
  publicTagsOutputDirectory: fpr('public/blog/tags'),
};

/**
 * Exports the combined configuration settings.
 */
const config = {
  ...coreSiteConfig,
  ...corePathConfig,
  ...themeConfig,
  ...moduleConfig,
  ...blogModuleConfig,
} satisfies Config & BlogModuleConfig;

export default config;
