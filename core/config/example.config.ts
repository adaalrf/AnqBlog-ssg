import { fpr } from '../shared/path-and-file-utils.js';
import type {
  BlogModuleConfig,
  Config,
  CorePathConfig,
  CoreSiteConfig,
  ModuleConfig,
  ThemeConfig,
} from '../types/config.js';

/**
 * Example configuration file for the static site generator.
 *
 * Copy this file to `core/config/config.ts` and customize the values for your site.
 * The `config.ts` file is gitignored and should contain your site-specific settings.
 */
const coreSiteConfig: CoreSiteConfig = {
  siteName: 'My Blog', // Site name displayed in header
  siteDescription: 'My awesome blog', // Site description for meta tags
  siteUrl: 'https://example.com', // Base URL (used for canonical URLs and Open Graph)
  githubUrl: 'https://github.com/username', // GitHub profile URL
  authorName: 'username', // Author name displayed in footer
  copyrightYear: new Date().getFullYear(), // Copyright year (auto-updates)
  dateLocale: 'en-US', // Locale for date formatting (e.g., 'en-US', 'en-GB', 'de-DE', 'fr-FR')
  siteLanguage: 'en', // HTML lang attribute (e.g., 'en', 'es', 'fr', 'de')
};

/**
 * Theme configuration settings for the static site generator.
 */
const themeConfig: ThemeConfig = {
  themes: ['dark', 'light', 'rose', 'mono'],
  defaultTheme: 'dark',
};

/**
 * Path configuration settings for the static site generator.
 */
const corePathConfig: CorePathConfig = {
  inputCSS: fpr('styles/tailwind.css'),
  outputCSS: fpr('public/styles/styles.css'),
  contentDirectory: fpr('content'),
  template404Path: fpr('templates/404-template.html'),
  mainLayoutPath: fpr('templates/layout-template.html'),
  publicContentOutputDirectory: fpr('public'),
};

/**
 * Module configuration settings for the static site generator.
 */
const modulesConfig: ModuleConfig = {
  modules: ['blog'],
};

/**
 * Blog module configuration settings.
 * Required when modules includes 'blog'.
 */
const blogModuleConfig: BlogModuleConfig = {
  postsPerPage: 5, // Number of posts per paginated page
  previewLength: 200, // Character length for post previews
  titleTruncationLength: 25, // Max title length in post listings
  titleTruncationLengthBreadcrumb: 20, // Max title length in breadcrumbs
  paginationWindowSize: 5, // Number of page links in pagination
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
  ...modulesConfig,
  ...blogModuleConfig,
} satisfies Config;

export default config;
