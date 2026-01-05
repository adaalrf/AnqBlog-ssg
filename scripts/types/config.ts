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
    templateTagsPath: string;
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
export type Config = SiteConfig & PathConfig;

