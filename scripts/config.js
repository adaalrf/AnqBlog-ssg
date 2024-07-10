import { fr } from './utils/resolve-path.js';

export default {
  markedConfigPath: fr('marked.json'),
  contentDirectory: fr('src/content'),
  postsContentDirectory: fr('src/content/blog/posts'),
  templatePostsPath: fr('src/templates/post-template.html'),
  templateBlogPath: fr('src/templates/blog-template.html'),
  mainLayoutPath: fr('src/templates/layout-template.html'),
  tempPostsOutputDirectory: fr('src/temp/blog/posts'),
  tempTagsOutputDirectory: fr('src/temp/blog/tags'),
  tempBlogOutputPath: fr('src/temp/blog'),
  publicContentOutputDirectory: fr('public'),
  publicBlogOutputPath: fr('public/blog'),
  publicPostsOutputDirectory: fr('public/blog/posts'),
  publicTagsOutputDirectory: fr('public/blog/tags'),
};
