/**
 * Type definitions for site and path configuration.
 *
 * These types ensure type safety when working with configuration objects
 * throughout the build system.
 */

/**
 * Site configuration settings.
 */
export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  githubUrl: string;
  authorName: string;
  copyrightYear: number;
  postsPerPage: number;
  previewLength: number;
  titleTruncationLength: number;
  titleTruncationLengthBreadcrumb: number;
  paginationWindowSize: number;
  dateLocale: string;
  siteLanguage: string;
  maxMarkdownFileSize?: number; // Maximum file size in bytes (default: 5MB)
}

/**
 * Theme configuration settings.
 */
export interface ThemeConfig {
  themes: string[];
  defaultTheme: string;
}

/**
 * Plugin configuration settings.
 */
export interface PluginConfig {
  plugins: string[];
}

/**
 * Path configuration settings.
 */
export interface PathConfig {
  inputCSS: string;
  outputCSS: string;
  contentDirectory: string;
  postsContentDirectory: string;
  templatePostsPath: string;
  templateBlogPath: string;
  templateMainTagsPath: string;
  template404Path: string;
  mainLayoutPath: string;
  tempPostsOutputDirectory: string;
  tempTagsOutputDirectory: string;
  tempBlogOutputPath: string;
  publicContentOutputDirectory: string;
  publicBlogOutputPath: string;
  publicPostsOutputDirectory: string;
  publicTagsOutputDirectory: string;
}

/**
 * Combined configuration (site + path).
 */
export type Config = SiteConfig & PathConfig & ThemeConfig & PluginConfig;
