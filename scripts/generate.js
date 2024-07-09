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
const { log } = require('console');

// Paths
const configPath = fr('marked.json');
const postsDirectory = fr('src/posts');
const postTemplatePath = fr('src/templates/post-template.html');
const mainLayoutPath = fr('src/templates/layout-template.html');
const postOutputDirectory = fr('src/content/posts');
const blogTemplatePath = fr('src/templates/blog-template.html');
const blogOutputPath = fr('public/blog');
const publicPostsDirectory = fr('public/posts');
const tagsOutputDirectory = fr('public/blog/tags');

// Read and parse configuration
readConfig(configPath);

// Helper function to parse the custom date format
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to format the date for display
const formatDate = (date) => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date object');
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Helper function to generate HTML content
const generateHtmlContent = (templatePath, data, outputPath) => {
  const templateContent = readFileContent(templatePath);
  const dom = injectContentIntoTemplate(templateContent, data);
  const contentDiv = dom.window.document.querySelector('.content-div');

  if (!contentDiv) {
    throw new Error(
      `Element '.content-div' not found in template ${templatePath}`,
    );
  }

  const htmlContent = contentDiv.outerHTML;
  fs.writeFileSync(outputPath, htmlContent);
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

// Generate tag pages
const generateTagPages = (tags, posts) => {
  ensureDirectoryExists(tagsOutputDirectory); // Ensure the tags directory exists

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags.includes(tag));
    const tagContent = tagPosts.map((post) => ({
      title: post.title,
      date: new Date(post.date),
      tags: post.tags,
      htmlFileName: post.htmlFileName,
      previewContent: post.previewContent,
    }));

    const dom = new JSDOM(readFileContent(blogTemplatePath));
    const document = dom.window.document;
    const postLinksDiv = document.getElementById('post-links-div');
    const postItemTemplate = document.querySelector('.post-item-template');

    if (!postItemTemplate || !postLinksDiv) {
      throw new Error(
        'Template or placeholder element not found in the HTML template.',
      );
    }

    tagContent.forEach((post) => {
      const { title, date, tags, htmlFileName, previewContent } = post;
      const titleLink = `<a href="../posts/${htmlFileName}">${title}</a>`;

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
            .map((tag) => `<a href="./${tag}.html">${tag}</a>`)
            .join(' ');
          tagsContainer.innerHTML = tagsList;
        } else {
          tagsContainer.remove();
          if (tagDivider) tagDivider.remove();
        }
      }

      postLinksDiv.appendChild(postItem);
    });

    postItemTemplate.remove();
    const tagPageContent = document.querySelector('#blog').outerHTML;

    const outputPath = path.join(tagsOutputDirectory, `${tag}.html`);
    const relativeOutputPath = rp(
      tagsOutputDirectory,
      `${tag}.html`,
      fr('public'),
    );

    const finalHtml = replacePlaceholders(readFileContent(mainLayoutPath), {
      title: `Posts tagged with "${tag}"`,
      children: tagPageContent,
      stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
      faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
      scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
      gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
    });

    fs.writeFileSync(outputPath, finalHtml);
    console.log(`Generated tag page for ${tag}: ${outputPath}`);
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

  ensureDirectoryExists(blogOutputPath); // Ensure the directory exists

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

    // Helper function to create a post item element
    const createPostItem = (post) => {
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
            .map((tag) => `<a href="./tags/${tag}.html">${tag}</a>`)
            .join(' ');
          tagsContainer.innerHTML = tagsList;
        } else {
          tagsContainer.remove();
          if (tagDivider) tagDivider.remove();
        }
      }

      return postItem;
    };

    // Add each post to the post links container
    pagePosts.forEach((post) => postLinksDiv.appendChild(createPostItem(post)));

    // Helper function to update pagination links
    const updatePaginationLink = (pageLink, index, isCurrentPage) => {
      pageLink.className = '';
      const classNames = isCurrentPage
        ? classesCurrentPageLink
        : classesNormalPageLink;
      pageLink.classList.add(...classNames);
      pageLink.href = index === 0 ? 'blog.html' : `blog-page-${index + 1}.html`;
      pageLink.textContent = index + 1;
      pageLink.classList.remove('hidden');
    };

    // Determine the range of pages to display
    const totalPages = paginatedPosts.length;
    const startPage = Math.max(0, Math.min(totalPages - 5, pageIndex - 2));
    const endPage = Math.min(totalPages, startPage + 5);

    const paginationDiv = document.querySelector('.pagination');
    const previousLink = paginationDiv.querySelector('.previous-blog-page');
    const nextLink = paginationDiv.querySelector('.next-blog-page');

    const classesNormalPageLink = document
      .getElementById('page-link-1')
      .className.split(' ');
    const classesCurrentPageLink = document
      .getElementById('page-link-3')
      .className.split(' ');

    // Update pagination links
    for (let i = startPage; i < endPage; i++) {
      const pageLink = paginationDiv.querySelector(
        `#page-link-${i - startPage + 1}`,
      );
      const isActivePage = i === pageIndex; // Determine if the current page is the active page
      updatePaginationLink(pageLink, i, isActivePage); // Update the pagination link with the appropriate details
    }

    // Next page link
    nextLink.classList.toggle('hidden', pageIndex >= paginatedPosts.length - 1);
    if (!nextLink.classList.contains('hidden')) {
      nextLink.href = `blog-page-${pageIndex + 2}.html`;
    }

    // Previous page link
    previousLink.classList.toggle('hidden', pageIndex <= 0);
    if (!previousLink.classList.contains('hidden')) {
      previousLink.href =
        pageIndex === 1 ? 'blog.html' : `blog-page-${pageIndex}.html`;
    }

    postLinksDiv.appendChild(paginationDiv);
    postItemTemplate.remove();

    const blogContent = document.querySelector('#blog').outerHTML;
    const relativeOutputPath = rp(
      path.dirname(
        path.join(blogOutputPath, `blog-page-${pageIndex + 1}.html`),
      ),
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
        ? path.join(blogOutputPath, `index.html`)
        : path.join(blogOutputPath, `blog-page-${pageIndex + 1}.html`);
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

  generateIntermediatePostHtmlFiles(posts);
  generateFinalPostHtmlFiles(posts);
  generateBlogHtmlFiles(posts, 2); // 5 posts per page
  generateTagPages(tags, posts); // Generate tag pages

  const contentDirectory = fr('src/content');
  const publicContentDirectory = fr('public');
  applyLayoutToHtmlFiles(contentDirectory, publicContentDirectory);
};

// Execute the HTML file generation
generateAllHtmlFiles();
