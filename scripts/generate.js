const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const matter = require('gray-matter');
const { fr, rp } = require('./utils/resolve-path');
const {
  readConfig,
  readFileContent,
  injectContentIntoTemplate,
  processMarkdownFiles,
  replacePlaceholders,
  ensureDirectoryExists,
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

// Helper function to parse the custom date format
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to format the date for display
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to generate HTML content
const generateHtmlContent = (templatePath, data, outputPath) => {
  const templateContent = readFileContent(templatePath);
  const dom = injectContentIntoTemplate(templateContent, data);
  const htmlContent =
    dom.window.document.querySelector('.content-div').outerHTML;
  fs.writeFileSync(outputPath, htmlContent);
  console.log(`Generated ${outputPath}`);
};

// Generate intermediate post HTML files
const generateIntermediatePostHtmlFiles = (posts) => {
  posts.forEach((post) => {
    const { title, date, tags, htmlFileName, content } = post;
    generateHtmlContent(
      postTemplatePath,
      { title, date: formatDate(date), tags, content },
      path.join(postOutputDirectory, htmlFileName),
    );
  });
};

// Generate final post HTML files with layout
const generateFinalPostHtmlFiles = (posts) => {
  const mainLayoutContent = readFileContent(mainLayoutPath);

  posts.forEach((post) => {
    const { title, htmlFileName } = post;
    const postContentPath = path.join(postOutputDirectory, htmlFileName);
    const postContent = readFileContent(postContentPath);

    const relativeOutputPath = rp(
      publicPostsDirectory,
      htmlFileName,
      fr('public'),
    );

    const finalHtml = replacePlaceholders(mainLayoutContent, {
      title,
      children: postContent,
      stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
      faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
      scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
      gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
    });

    fs.writeFileSync(path.join(publicPostsDirectory, htmlFileName), finalHtml);
    console.log(`Generated ${path.join(publicPostsDirectory, htmlFileName)}`);
  });
};

// Split posts into pages
const paginatePosts = (posts, postsPerPage) => {
  const paginatedPosts = [];
  for (let i = 0; i < posts.length; i += postsPerPage) {
    paginatedPosts.push(posts.slice(i, i + postsPerPage));
  }
  return paginatedPosts;
};

// Generate paginated blog HTML files
const generateBlogHtmlFiles = (posts, postsPerPage) => {
  const paginatedPosts = paginatePosts(posts, postsPerPage);
  const mainLayoutContent = readFileContent(mainLayoutPath);

  paginatedPosts.forEach((pagePosts, pageIndex) => {
    const blogTemplateContent = readFileContent(blogTemplatePath);
    const dom = new JSDOM(blogTemplateContent);
    const document = dom.window.document;
    const postItemTemplate = document.querySelector('.post-item-template');
    const postLinksDiv = document.getElementById('post-links-div');

    if (!postItemTemplate || !postLinksDiv) {
      throw new Error(
        'Template or placeholder element not found in the HTML template.',
      );
    }

    pagePosts.forEach((post) => {
      const { title, date, tags, htmlFileName, previewContent } = post;
      const titleLink = `<a href="./posts/${htmlFileName}">${title}</a>`;

      const postItem = postItemTemplate.cloneNode(true);
      postItem.style.display = 'list-item';
      postItem.querySelector('.post-title').innerHTML = titleLink;
      postItem.querySelector('.post-date').innerHTML = formatDate(date);
      postItem.querySelector('.content').innerHTML = previewContent;

      const tagsContainer = postItem.querySelector('.tags');
      const tagDivider = postItem.querySelector('#tag-divider');
      if (tagsContainer) {
        if (tags && tags.length > 0) {
          const tagsList = tags
            .map((tag) => `<a href="#">${tag}</a>`)
            .join(' ');
          tagsContainer.innerHTML = tagsList;
        } else {
          tagsContainer.remove();
          if (tagDivider) tagDivider.remove();
        }
      }
      postLinksDiv.appendChild(postItem);
    });

    // Add pagination links
    const paginationDiv = document.querySelector('.pagination');
    if (pageIndex > 0) {
      const previousLink = document.querySelector('.previous-blog-page');
      previousLink.classList.remove('hidden');
      previousLink.href =
        pageIndex === 1 ? 'blog.html' : `blog-page-${pageIndex}.html`;
      paginationDiv.appendChild(previousLink);

      for (let i = 1; i <= pageIndex; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = `blog-page-${i}.html`;
        pageLink.innerHTML = pageIndex;
        // Change the link text for the first page, hacky I know but works for now
        if (pageLink.href === `blog-page-1.html`) {
          pageLink.href = `blog.html`;
          pageLink.innerHTML = `1`;
        }
        paginationDiv.appendChild(pageLink);
      }
      // Add the current page link
      const currentPageLink = document.querySelector('.current-page');
      currentPageLink.href = `blog-page-${pageIndex + 1}.html`;
      currentPageLink.innerHTML = pageIndex + 1;
      paginationDiv.appendChild(currentPageLink);
    }

    if (pageIndex < paginatedPosts.length - 1) {
      const nextLink = document.querySelector('.next-blog-page');
      nextLink.classList.remove('hidden');
      nextLink.href = `blog-page-${pageIndex + 2}.html`;

      for (let i = pageIndex + 1; i < paginatedPosts.length; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = `blog-page-${i + 1}.html`;
        pageLink.innerHTML = i + 1;
        paginationDiv.appendChild(pageLink);
      }

      paginationDiv.appendChild(nextLink);
    }
    postLinksDiv.appendChild(paginationDiv);

    postItemTemplate.remove();

    const blogContent = document.querySelector('#blog').outerHTML;
    const relativeOutputPath = rp(
      path.dirname(blogOutputPath),
      `blog-page-${pageIndex + 1}.html`,
      fr('public'),
    );

    const finalBlogHtml = replacePlaceholders(mainLayoutContent, {
      title: 'Blog',
      children: blogContent,
      stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
      faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
      scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
      gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
    });

    const outputFilePath =
      pageIndex === 0
        ? blogOutputPath
        : path.join(fr('public'), `blog-page-${pageIndex + 1}.html`);
    fs.writeFileSync(outputFilePath, finalBlogHtml);
    console.log(`Generated ${outputFilePath}`);
  });
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

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(postOutputDirectory);
  ensureDirectoryExists(publicPostsDirectory);

  const posts = processMarkdownFiles(postsDirectory)
    .map((post) => ({ ...post, date: parseDate(post.date) }))
    .sort((a, b) => b.date - a.date);

  generateIntermediatePostHtmlFiles(posts);
  generateFinalPostHtmlFiles(posts);
  generateBlogHtmlFiles(posts, 5); // 5 posts per page

  const contentDirectory = fr('src/content');
  const publicContentDirectory = fr('public');
  applyLayoutToHtmlFiles(contentDirectory, publicContentDirectory);
};

// Execute the HTML file generation
generateAllHtmlFiles();
