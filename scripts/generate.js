// Description: This script generates all HTML files for the blog and content pages.
const {
  generateIntermediatePostHtmlFiles,
} = require('./blog/generate-intermediate-posts');
const { generateFinalPostHtmlFiles } = require('./blog/generate-final-posts');
const {
  generatePaginatedBlogHtmlFiles,
} = require('./blog/generate-paginated-blog');
const { generateTagPages } = require('./blog/generate-tag-pages');
const {
  processMarkdownFiles,
  ensureDirectoryExists,
  replacePlaceholders,
} = require('./utils/parsing-utils');
const { readConfig, readFileContent } = require('./utils/parsing-utils');
const { fr, rp } = require('./utils/resolve-path');
const { parseDate } = require('./utils/date-utils');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

// Paths
const configPath = fr('marked.json');
const postsDirectory = fr('src/posts');
const postTemplatePath = fr('src/templates/post-template.html');
const mainLayoutPath = fr('src/templates/layout-template.html');
const postOutputDirectory = fr('src/content/posts');
const blogTemplatePath = fr('src/templates/blog-template.html');
const blogOutputPath = fr('public/blog');
const publicPostsDirectory = fr('public/blog/posts');
const tagsOutputDirectory = fr('public/blog/tags');

// Read and parse configuration
readConfig(configPath);

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(postOutputDirectory);
  ensureDirectoryExists(publicPostsDirectory);
  ensureDirectoryExists(blogOutputPath); // Ensure the blog directory exists
  ensureDirectoryExists(tagsOutputDirectory); // Ensure the tags directory exists inside blog

  // Ensure all dates are parsed as Date objects
  const posts = processMarkdownFiles(postsDirectory)
    .map((post) => ({ ...post, date: parseDate(post.date) }))
    .sort((a, b) => b.date - a.date)
    .map((post) => ({ ...post, date: new Date(post.date) }));

  // Collect all tags
  const tags = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tags[tag]) {
        tags[tag] = [];
      }
      tags[tag].push(post);
    });
  });

  generateIntermediatePostHtmlFiles(
    posts,
    postTemplatePath,
    postOutputDirectory,
  );
  generateFinalPostHtmlFiles(
    posts,
    mainLayoutPath,
    postOutputDirectory,
    publicPostsDirectory,
  );
  generatePaginatedBlogHtmlFiles(
    posts,
    5,
    blogTemplatePath,
    mainLayoutPath,
    blogOutputPath,
  ); // 5 posts per page
  generateTagPages(
    tags,
    posts,
    blogTemplatePath,
    mainLayoutPath,
    tagsOutputDirectory,
  ); // Generate tag pages

  const contentDirectory = fr('src/content');
  const publicContentDirectory = fr('public');
  applyLayoutToHtmlFiles(contentDirectory, publicContentDirectory);
};

// Apply layout to all HTML files in a directory
const applyLayoutToHtmlFiles = (inputDir, outputDir) => {
  const files = fs.readdirSync(inputDir);

  files.forEach((file) => {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);

    if (file === 'posts') {
      return;
    }

    if (fs.statSync(inputFilePath).isDirectory()) {
      ensureDirectoryExists(outputFilePath);
      applyLayoutToHtmlFiles(inputFilePath, outputFilePath);
    } else if (file.endsWith('.html')) {
      const fileContent = readFileContent(inputFilePath);

      const templateFilePath = path.join(
        fr('src/templates'),
        `${path.basename(file, '.html')}-template.html`,
      );
      const specificTemplateExists = fs.existsSync(templateFilePath);

      let mainContent;
      if (specificTemplateExists) {
        const templateContent = readFileContent(templateFilePath);
        const dom = new JSDOM(templateContent);
        const document = dom.window.document;
        const mainElementTemplate = document.querySelector('#main');
        if (!mainElementTemplate) {
          throw new Error('Main element not found in specific template');
        }
        const contentDom = new JSDOM(fileContent);
        const content =
          contentDom.window.document.querySelector('#main').innerHTML;
        mainElementTemplate.innerHTML = content;
        mainContent = mainElementTemplate.innerHTML;
      } else {
        const contentDom = new JSDOM(fileContent);
        mainContent =
          contentDom.window.document.querySelector('#main').outerHTML;
      }

      const relativeOutputPath = rp(
        path.dirname(outputFilePath),
        file,
        fr('public'),
      );
      const mainLayoutContent = readFileContent(mainLayoutPath);
      const finalHtml = replacePlaceholders(mainLayoutContent, {
        title: path.basename(file, '.html'),
        children: mainContent,
        stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
        faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
        scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
        gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
      });

      fs.writeFileSync(outputFilePath, finalHtml);
      console.log(`Processed ${outputFilePath}`);
    }
  });
};

// Execute the HTML file generation
generateAllHtmlFiles();
