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
 * Core configuration that is always required.
 */
export type CoreConfig = CoreSiteConfig & CorePathConfig & ThemeConfig & ModuleConfig;

/**
 * Final merged configuration used by the build system.
 * Modules can extend this with additional keys in user config.
 */
export type Config = CoreConfig & Record<string, unknown>;
