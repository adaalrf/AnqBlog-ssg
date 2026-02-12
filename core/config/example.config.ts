import { fpr } from '../shared/path-and-file-utils.js';
import type {
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
 *
 * Add module-specific config keys in this file when enabling modules.
 * Example: for blog, add BlogModuleConfig keys documented in modules/blog/README.md
 * (and typed in modules/blog/types.ts).
 */
const modulesConfig: ModuleConfig = {
  modules: [],
};

/**
 * Exports the combined configuration settings.
 */
const config = {
  ...coreSiteConfig,
  ...corePathConfig,
  ...themeConfig,
  ...modulesConfig,
} satisfies Config;

export default config;
