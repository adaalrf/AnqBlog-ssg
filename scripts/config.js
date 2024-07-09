const { fr } = require('./utils/resolve-path');

module.exports = {
  configPath: fr('marked.json'),
  postsDirectory: fr('src/posts'),
  postTemplatePath: fr('src/templates/post-template.html'),
  mainLayoutPath: fr('src/templates/layout-template.html'),
  postOutputDirectory: fr('src/content/posts'),
  blogTemplatePath: fr('src/templates/blog-template.html'),
  blogOutputPath: fr('public/blog'),
  publicPostsDirectory: fr('public/blog/posts'),
  tagsOutputDirectory: fr('public/blog/tags'),
  contentDirectory: fr('src/content'),
  publicContentDirectory: fr('public'),
};
