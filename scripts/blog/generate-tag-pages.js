// Description: Generates tag pages for the blog.
const {
  readFileContent,
  replacePlaceholders,
  ensureDirectoryExists,
} = require('../utils/parsing-utils');
const { fr, rp } = require('../utils/resolve-path');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { formatDate } = require('../utils/date-utils');

/**
 * Generates tag pages.
 * @param {object} tags - The tags with associated posts.
 * @param {Array} posts - The array of posts.
 * @param {string} blogTemplatePath - The path to the blog template.
 * @param {string} mainLayoutPath - The path to the main layout template.
 * @param {string} tagsOutputDirectory - The directory to save the tag pages.
 */
const generateTagPages = (
  tags,
  posts,
  blogTemplatePath,
  mainLayoutPath,
  tagsOutputDirectory,
) => {
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

module.exports = { generateTagPages };
