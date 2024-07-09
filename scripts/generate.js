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
  readFileContent,
} = require('./utils/parsing-utils');
const { fr, rp } = require('./utils/resolve-path');
const { parseDate } = require('./utils/date-utils');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(config.postOutputDirectory);
  ensureDirectoryExists(config.publicPostsDirectory);
  ensureDirectoryExists(config.blogOutputPath);
  ensureDirectoryExists(config.tagsOutputDirectory);

  // Ensure all dates are parsed as Date objects
  const posts = processMarkdownFiles(config.postsDirectory)
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
    config.postTemplatePath,
    config.postOutputDirectory,
  );
  generateFinalPostHtmlFiles(
    posts,
    config.mainLayoutPath,
    config.postOutputDirectory,
    config.publicPostsDirectory,
  );
  generatePaginatedBlogHtmlFiles(
    posts,
    5,
    config.blogTemplatePath,
    config.mainLayoutPath,
    config.blogOutputPath,
  );
  generateTagPages(
    tags,
    posts,
    config.blogTemplatePath,
    config.mainLayoutPath,
    config.tagsOutputDirectory,
  );

  const contentDirectory = fr('src/content');
  const publicContentDirectory = fr('public');

  if (!contentDirectory || !publicContentDirectory) {
    console.error(
      'Error: contentDirectory or publicContentDirectory is not defined.',
    );
    return;
  }

  applyLayoutToHtmlFiles(contentDirectory, publicContentDirectory);
};

// Apply layout to all HTML files in a directory
const applyLayoutToHtmlFiles = (inputDir, outputDir) => {
  if (!inputDir || !outputDir) {
    throw new Error('Invalid inputDir or outputDir');
  }

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
      const mainLayoutContent = readFileContent(config.mainLayoutPath);
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
