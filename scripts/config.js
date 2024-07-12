import { fpr } from './utils/resolve-path.js';

export default {
  markedConfigPath: fpr('marked.json'),
  contentDirectory: fpr('src/content'),
  postsContentDirectory: fpr('src/content/blog/posts'),
  templatePostsPath: fpr('src/templates/post-template.html'),
  templateBlogPath: fpr('src/templates/blog-template.html'),
  templateTagsPath: fpr('src/templates/tags-template.html'),
  mainLayoutPath: fpr('src/templates/layout-template.html'),
  tempPostsOutputDirectory: fpr('src/temp/blog/posts'),
  tempTagsOutputDirectory: fpr('src/temp/blog/tags'),
  tempBlogOutputPath: fpr('src/temp/blog'),
  publicContentOutputDirectory: fpr('public'),
  publicBlogOutputPath: fpr('public/blog'),
  publicPostsOutputDirectory: fpr('public/blog/posts'),
  publicTagsOutputDirectory: fpr('public/blog/tags'),
};
