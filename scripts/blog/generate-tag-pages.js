// Description: Generates tag pages for the blog.
import {
  readFileContent,
  ensureDirectoryExists,
} from '../utils/parsing-utils.js';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { formatDate } from '../utils/date-utils.js';

/**
 * Generates tag pages.
 * @param {object} tags - The tags with associated posts.
 * @param {Array} posts - The array of posts.
 * @param {string} blogTemplatePath - The path to the blog template.
 * @param {string} publicTagsOutputDirectory - The directory to save the tag pages.
 */
export const generateTagPages = (
  tags,
  posts,
  blogTemplatePath,
  publicTagsOutputDirectory,
) => {
  ensureDirectoryExists(publicTagsOutputDirectory); // Ensure the tags directory exists

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

    const outputPath = path.join(publicTagsOutputDirectory, `${tag}.html`);
    fs.writeFileSync(outputPath, tagPageContent);
    console.log(`Generated content for tag page ${tag}: ${outputPath}`);
  });
};
