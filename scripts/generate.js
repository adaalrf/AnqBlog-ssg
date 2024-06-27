const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { fr } = require('./resolve-path');
const {
  readConfig,
  readFileContent,
  injectContentIntoTemplate,
  processMarkdownFiles,
} = require('./utils/parsing-utils');

// Paths
const configPath = fr('marked.json');
const postsDirectory = fr('src/posts');
const postTemplatePath = fr('src/templates/post-template.html');
const mainLayoutPath = fr('src/templates/layout-template.html');
const postOutputDirectory = fr('src/content/posts');
const blogTemplatePath = fr('src/templates/blog-template.html');
const blogOutputPath = fr('public/blog.html');
const publicPostsDirectory = fr('public/posts');

// Read and parse configuration
readConfig(configPath);

// Ensure output directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Generate intermediate post HTML files
const generateIntermediatePostHtmlFiles = (posts) => {
  posts.forEach((post) => {
    const { title, date, tags, htmlFileName, content } = post;
    const postTemplateContent = readFileContent(postTemplatePath);

    const dom = injectContentIntoTemplate(
      postTemplateContent,
      { title, date, tags, content },
      {
        tagWrapper: (tag) => `<a href="#">${tag}</a>`,
        tagsContainerSelector: '.tags',
        tagDividerSelector: '#post-tag-divider',
      },
    );

    const postContent = dom.window.document.querySelector('#main').outerHTML;

    const outputFilePath = path.join(postOutputDirectory, htmlFileName);
    fs.writeFileSync(outputFilePath, postContent);

    console.log(`Generated intermediate ${outputFilePath}`);
  });
};

// Generate final post HTML files with layout
const generateFinalPostHtmlFiles = (posts) => {
  const mainLayoutContent = readFileContent(mainLayoutPath);

  posts.forEach((post) => {
    const { title, htmlFileName } = post;
    const postContentPath = path.join(postOutputDirectory, htmlFileName);
    const postContent = readFileContent(postContentPath);

    const finalHtml = mainLayoutContent
      .replace('{{title}}', title)
      .replace('{{children}}', postContent)
      .replace('{{stylesPath}}', '../styles/styles.css')
      .replace('{{faviconPath}}', '../assets/favicon.webp')
      .replace('{{scriptPath}}', '../js/bundle.js');

    const outputFilePath = path.join(publicPostsDirectory, htmlFileName);
    fs.writeFileSync(outputFilePath, finalHtml);

    console.log(`Generated ${outputFilePath}`);
  });
};

// Generate blog HTML file
const generateBlogHtmlFile = (posts) => {
  const blogTemplateContent = readFileContent(blogTemplatePath);
  const mainLayoutContent = readFileContent(mainLayoutPath);

  const dom = new JSDOM(blogTemplateContent);
  const document = dom.window.document;
  const postItemTemplate = document.getElementById('post-item-template');
  const postLinksDiv = document.getElementById('post-links-div');

  if (!postItemTemplate || !postLinksDiv) {
    throw new Error(
      'Template or placeholder element not found in the HTML template.',
    );
  }

  posts.forEach((post) => {
    const { title, date, tags, htmlFileName, previewContent } = post;
    const titleLink = `<a href="./posts/${htmlFileName}">${title}</a>`;

    const postItem = postItemTemplate.cloneNode(true);
    postItem.style.display = 'list-item';
    postItem.querySelector('h1').innerHTML = titleLink;
    postItem.querySelector('h2').innerHTML = date;
    postItem.querySelector('.content').innerHTML = previewContent;

    const tagsContainer = postItem.querySelector('.tags');
    const tagDivider = postItem.querySelector('#tag-divider');
    if (tagsContainer) {
      if (tags && tags.length > 0) {
        const tagsList = tags.map((tag) => `<a href="#">${tag}</a>`).join(' ');
        tagsContainer.innerHTML = tagsList;
      } else {
        tagsContainer.remove();
        if (tagDivider) tagDivider.remove();
      }
    }

    postLinksDiv.appendChild(postItem);
  });

  postItemTemplate.remove();

  const blogContent = document.querySelector('#content-div').innerHTML;

  const finalBlogHtml = mainLayoutContent
    .replace('{{title}}', 'Blog')
    .replace('{{children}}', blogContent)
    .replace('{{stylesPath}}', 'styles/styles.css')
    .replace('{{faviconPath}}', 'assets/favicon.webp')
    .replace('{{scriptPath}}', 'js/bundle.js');

  fs.writeFileSync(blogOutputPath, finalBlogHtml);

  console.log(`Generated ${blogOutputPath}`);
};

// Apply layout to all HTML files in a directory
const applyLayoutToHtmlFiles = (inputDir, outputDir) => {
  const files = fs.readdirSync(inputDir);

  files.forEach((file) => {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, file);

    // Skip the posts directory
    if (file === 'posts') {
      return;
    }

    if (fs.statSync(inputFilePath).isDirectory()) {
      ensureDirectoryExists(outputFilePath);
      applyLayoutToHtmlFiles(inputFilePath, outputFilePath);
    } else if (file.endsWith('.html')) {
      const fileContent = readFileContent(inputFilePath);
      const mainLayoutContent = readFileContent(mainLayoutPath);

      const dom = new JSDOM(fileContent);
      const mainContent = dom.window.document.querySelector('#main').innerHTML;

      const finalHtml = mainLayoutContent
        .replace('{{title}}', 'Document')
        .replace('{{children}}', mainContent)
        .replace('{{stylesPath}}', 'styles/styles.css')
        .replace('{{faviconPath}}', 'assets/favicon.webp')
        .replace('{{scriptPath}}', 'js/bundle.js');

      fs.writeFileSync(outputFilePath, finalHtml);

      console.log(`Processed ${outputFilePath}`);
    }
  });
};

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(postOutputDirectory);
  ensureDirectoryExists(publicPostsDirectory);

  const posts = processMarkdownFiles(postsDirectory);
  generateIntermediatePostHtmlFiles(posts);
  generateFinalPostHtmlFiles(posts);
  generateBlogHtmlFile(posts);

  // Apply layout to all HTML files in src/content directory, excluding posts
  const contentDirectory = fr('src/content');
  const publicContentDirectory = fr('public');
  applyLayoutToHtmlFiles(contentDirectory, publicContentDirectory);
};

// Execute the HTML file generation
generateAllHtmlFiles();
