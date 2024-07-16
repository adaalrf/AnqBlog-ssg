import {
  paginatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';
import { generateFrontMatter } from '../utils/content-utils.js';
import {
  readFileContent,
  ensureDirectoryExists,
  writeFileContent,
} from '../utils/path-and-file-utils.js';
import path from 'path';
import { JSDOM } from 'jsdom';
import config from '../config.js';

/**
 * Generates tag pages for the blog.
 * @param {object} tags - The tags with associated posts.
 * @param {array} posts - The array of posts.
 * @param {number} postsPerPage - The number of posts per page.
 * @param {string} templateTagsPath - The path to the tags template.
 * @param {string} templateMainTagsPath - The path to the main tags index template.
 * @param {string} tempTagsOutputDirectory - The directory to save the paginated tag pages.
 */
export const generateTagPages = (
  tags,
  posts,
  postsPerPage,
  templateTagsPath,
  templateMainTagsPath,
  tempTagsOutputDirectory,
) => {
  ensureDirectoryExists(tempTagsOutputDirectory); // Ensure the directory exists

  // Create an array to store tag link information for the index page
  const tagLinks = [];

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags.includes(tag));
    const tagContent = paginatePosts(tagPosts, postsPerPage);

    tagContent.forEach((pagePosts, pageIndex) => {
      const templateTagsContent = readFileContent(templateTagsPath);
      const dom = new JSDOM(templateTagsContent);
      const document = dom.window.document;
      const postItemTemplate = document.querySelector('.post-item');
      const postLinksDiv = document.getElementById('post-links-div');

      // Add each post to the post links container
      pagePosts.forEach((post) => {
        const postItem = createPostItem(
          post,
          postItemTemplate,
          `../../${config.publicPostsOutputDirectory}`,
          `../../${config.publicTagsOutputDirectory}`,
        );
        postLinksDiv.appendChild(postItem);
      });

      postItemTemplate.remove();
      updatePaginationLinks(document, pageIndex, tagContent, tag);

      // Save the tag page
      const content = document.querySelector('#tag').outerHTML;
      const filesWithDash = tag.split(' ').join('-');
      const outputFilePath =
        pageIndex === 0
          ? path.join(tempTagsOutputDirectory, `${filesWithDash}.html`)
          : path.join(
              tempTagsOutputDirectory,
              `${filesWithDash}-${pageIndex + 1}.html`,
            );
      const filesWithoutDash = tag.split('-').join(' ');
      const modifiedPathBar = `/ <a href=/blog/tags>Tags</a> / <em>${filesWithoutDash}</em>`;
      // Add dynamic front matter to the content
      const finalHtml = `${generateFrontMatter(posts, {
        page: modifiedPathBar,
        title: filesWithoutDash,
      })}\n${content}`;

      writeFileContent(outputFilePath, finalHtml);
      console.log(`(Tags.js): Generated tag page -> ${outputFilePath}`);

      // Add the link to the tagLinks array for the index page
      if (pageIndex === 0) {
        tagLinks.push({
          tag: filesWithoutDash,
          link: `${filesWithDash}.html`,
        });
      }
    });
  });

  // Generate the index.html page with links to all tags using a template
  const indexTemplateContent = readFileContent(templateMainTagsPath);
  const dom = new JSDOM(indexTemplateContent);
  const document = dom.window.document;
  const tagLinksContainer = document.getElementById('tag-links-container');

  if (!tagLinksContainer) {
    throw new Error(
      "The index template must contain an element with the ID 'tag-links-container'.",
    );
  }

  const tagLinkLiTemplate = document.getElementById('tag-link-li');
  const tagLinkAnchorTemplate = document.getElementById('tag-link');

  let linkElementLiClasses = [];
  let linkElementAnchorClasses = [];

  if (tagLinkLiTemplate) {
    linkElementLiClasses = tagLinkLiTemplate.className
      .split(' ')
      .filter(Boolean);
    tagLinkLiTemplate.remove();
  }

  if (tagLinkAnchorTemplate) {
    linkElementAnchorClasses = tagLinkAnchorTemplate.className
      .split(' ')
      .filter(Boolean);
    tagLinkAnchorTemplate.remove();
  }

  tagLinks.forEach((tagLink) => {
    if (!tagLink.link || !tagLink.tag) {
      console.error('Invalid tagLink:', tagLink);
      return;
    }
    const linkElement = document.createElement('a');
    linkElement.href = tagLink.link;
    linkElement.textContent = tagLink.tag;
    if (linkElementAnchorClasses.length) {
      linkElement.classList.add(...linkElementAnchorClasses);
    }
    const listItem = document.createElement('li');
    listItem.appendChild(linkElement);
    if (linkElementLiClasses.length) {
      listItem.classList.add(...linkElementLiClasses);
    }
    tagLinksContainer.appendChild(listItem);
  });

  const content = document.querySelector('#tags').outerHTML;
  const mainTagsPath = path.join(tempTagsOutputDirectory, 'index.html');
  const modifiedPathBar = `/ <em>Tags</em>`;
  // Add dynamic front matter to the content
  const finalIndexHtml = `${generateFrontMatter({
    page: modifiedPathBar,
    title: 'Tags',
  })}\n${content}`;

  writeFileContent(mainTagsPath, finalIndexHtml);
  console.log(`(Tags.js): Generated main tags page -> ${mainTagsPath}`);
};
