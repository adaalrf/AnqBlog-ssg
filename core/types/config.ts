/**
 * Type definitions for site and path configuration.
 *
 * These types ensure type safety when working with configuration objects
 * throughout the build system.
 */

/**
 * Core site configuration settings.
 */
export interface CoreSiteConfig {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  githubUrl: string;
  authorName: string;
  copyrightYear: number;
  dateLocale: string;
  siteLanguage: string;
}

/**
 * Theme configuration settings.
 */
export interface ThemeConfig {
  themes: string[];
  defaultTheme: string;
}

/**
 * Module configuration settings.
 */
export interface ModuleConfig {
  modules: string[];
}

/**
 * Core path configuration settings.
 */
export interface CorePathConfig {
  inputCSS: string;
  outputCSS: string;
  contentDirectory: string;
  template404Path: string;
  mainLayoutPath: string;
  publicContentOutputDirectory: string;
}

/**
 * Blog module site configuration settings.
 */
export interface BlogSiteConfig {
  postsPerPage: number;
  previewLength: number;
  titleTruncationLength: number;
  titleTruncationLengthBreadcrumb: number;
  paginationWindowSize: number;
  maxMarkdownFileSize?: number; // Maximum file size in bytes (default: 5MB)
}

/**
 * Blog module path configuration settings.
 */
export interface BlogPathConfig {
  postsContentDirectory: string;
  templatePostsPath: string;
  templateBlogPath: string;
  templateMainTagsPath: string;
  tempPostsOutputDirectory: string;
  tempTagsOutputDirectory: string;
  tempBlogOutputPath: string;
  publicBlogOutputPath: string;
  publicPostsOutputDirectory: string;
  publicTagsOutputDirectory: string;
}

/**
 * Blog module combined config settings.
 */
export type BlogModuleConfig = BlogSiteConfig & BlogPathConfig;

/**
 * Core configuration that is always required.
 */
export type CoreConfig = CoreSiteConfig & CorePathConfig & ThemeConfig & ModuleConfig;

/**
 * Final merged configuration used by the build system.
 */
export type Config = CoreConfig & Partial<BlogModuleConfig>;
