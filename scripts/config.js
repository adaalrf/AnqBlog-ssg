import { fpr } from './utils/path-and-file-utils.js';

/**
 * Site configuration settings for the static site generator.
 * @type {Object}
 */
const siteConfig = {
  siteName: '. adaalrf.dev',
  postsPerPage: 5,
  previewLength: 200, // Character length for post previews
  titleTruncationLength: 25, // Character length for truncated titles in post items
  titleTruncationLengthBreadcrumb: 20, // Character length for truncated titles in breadcrumbs
  paginationWindowSize: 5, // Number of page links to show in pagination
};

/**
 * Path configuration settings for the static site generator.
 * @type {Object}
 */
const pathConfig = {
  inputCSS: fpr('src/styles/tailwind.css'),
  outputCSS: fpr('public/styles/styles.css'),
  contentDirectory: fpr('src/content'),
  postsContentDirectory: fpr('src/content/blog/posts'),
  templatePostsPath: fpr('src/templates/post-template.html'),
  templateBlogPath: fpr('src/templates/blog-template.html'),
  templateMainTagsPath: fpr('src/templates/main-tags-template.html'),
  templateTagsPath: fpr('src/templates/tags-template.html'),
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
 * @type {Object}
 */
const config = {
  ...siteConfig,
  ...pathConfig,
};

export default config;
