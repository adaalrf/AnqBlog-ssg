import type { Config } from '../../core/types/config.js';
import type { LayoutDirectoryPair } from '../../core/types/layout.js';
import { createModuleConfigApi } from '../../core/shared/module-config-api.js';
import type { BlogModuleConfig } from './types.js';

const BLOG_REQUIRED_STRING_KEYS: Array<keyof BlogModuleConfig> = [
  'postsContentDirectory',
  'templatePostsPath',
  'templateBlogPath',
  'templateMainTagsPath',
  'tempPostsOutputDirectory',
  'tempTagsOutputDirectory',
  'tempBlogOutputPath',
  'publicBlogOutputPath',
  'publicPostsOutputDirectory',
  'publicTagsOutputDirectory',
];

const BLOG_REQUIRED_EXISTING_PATH_KEYS: Array<keyof BlogModuleConfig> = [
  'postsContentDirectory',
  'templatePostsPath',
  'templateBlogPath',
  'templateMainTagsPath',
];

/**
 * Validates blog module config keys and throws on invalid/missing values.
 */
export const validateBlogConfig = (config: Config): void => {
  const configApi = createModuleConfigApi('blog', config);

  for (const key of BLOG_REQUIRED_STRING_KEYS) {
    configApi.requireString(String(key));
  }
  for (const key of BLOG_REQUIRED_EXISTING_PATH_KEYS) {
    configApi.requireExistingPath(String(key));
  }

  configApi.requireInteger('postsPerPage', 1);
  configApi.requireInteger('previewLength', 0);
  configApi.requireInteger('titleTruncationLength', 1);
  configApi.requireInteger('titleTruncationLengthBreadcrumb', 1);
  configApi.requireInteger('paginationWindowSize', 1);
  configApi.optionalPositiveNumber('maxMarkdownFileSize');
};

/**
 * Returns a strongly typed blog config after validation.
 */
export const getBlogConfig = (config: Config): Config & BlogModuleConfig => {
  validateBlogConfig(config);
  return config as Config & BlogModuleConfig;
};

/**
 * Returns the blog module layout directory pairs.
 */
export const getBlogDirectoryPairs = (config: Config): LayoutDirectoryPair[] => {
  const blogConfig = getBlogConfig(config);
  return [
    {
      inputDir: blogConfig.tempPostsOutputDirectory,
      outputDir: blogConfig.publicPostsOutputDirectory,
    },
    {
      inputDir: blogConfig.tempTagsOutputDirectory,
      outputDir: blogConfig.publicTagsOutputDirectory,
    },
    {
      inputDir: blogConfig.tempBlogOutputPath,
      outputDir: blogConfig.publicBlogOutputPath,
    },
  ];
};
