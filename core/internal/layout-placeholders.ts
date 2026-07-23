import type { Config } from '../types/config.js';

interface BuildLayoutPlaceholdersInput {
  config: Config;
  data?: Record<string, unknown>;
  layoutData?: Record<string, string>;
  title: string;
  page: string;
  children: string;
  canonicalUrl: string;
  ogUrl?: string;
  ogType?: string;
  robots?: string;
}

/**
 * Builds a `<title>` value from site + optional page title.
 * Falls back to site-only title when page title is empty.
 */
export const buildDocumentTitle = (siteName: string, pageTitle?: string): string => {
  const normalizedPageTitle = typeof pageTitle === 'string' ? pageTitle.trim() : '';
  if (!normalizedPageTitle) {
    return siteName;
  }
  return `${siteName} | ${normalizedPageTitle}`;
};

/**
 * Builds the standard placeholder payload used by the main layout template.
 * Keeps core page rendering and 404 rendering aligned on shared defaults.
 */
export const buildLayoutPlaceholders = ({
  config,
  data = {},
  layoutData = {},
  title,
  page,
  children,
  canonicalUrl,
  ogUrl = canonicalUrl,
  ogType = 'website',
  robots,
}: BuildLayoutPlaceholdersInput): Record<string, unknown> => {
  const pageRobots = typeof data.robots === 'string' ? data.robots : undefined;

  return {
    ...data,
    ...layoutData,
    title,
    page,
    children,
    siteName: config.siteName || '',
    siteDescription: config.siteDescription || '',
    githubUrl: config.githubUrl || '',
    authorName: config.authorName || '',
    copyrightYear: config.copyrightYear || new Date().getFullYear(),
    siteLanguage: config.siteLanguage || 'en',
    canonicalUrl,
    ogUrl,
    ogType,
    robots: robots ?? pageRobots ?? 'index, follow',
    stylesPath: '/styles/styles.css',
    faviconPath: '/assets/favicon.ico',
    scriptPath: '/js/bundle.js',
    gitLogoPath: '/assets/github-icon.svg',
    themesList: (config.themes || ['dark', 'light', 'rose', 'mono']).join(' '),
    defaultTheme: config.defaultTheme || 'dark',
  };
};
