import {
  paginatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';
import {
  generateFrontMatter,
  normalizeTagForFile,
  denormalizeTagFromFile,
} from '../utils/content-utils.js';
import {
  readFileContent,
  ensureDirectoryExists,
  writeFileContent,
  sanitizeFilename,
} from '../utils/path-and-file-utils.js';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * Generates tag pages for the blog.
 * @param {Object} tags - The tags with associated posts.
 * @param {Array} posts - The array of posts.
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

  // Cache the template content to avoid reading it multiple times
  const templateTagsContent = readFileContent(templateTagsPath);

  // Create an array to store tag link information for the index page
  const tagLinks = [];

  Object.keys(tags).forEach((tag) => {
    const tagPosts = posts.filter((post) => post.tags && Array.isArray(post.tags) && post.tags.includes(tag));
    const tagContent = paginatePosts(tagPosts, postsPerPage);

    tagContent.forEach((pagePosts, pageIndex) => {
      // Create a new JSDOM instance from cached template for each page
      const dom = new JSDOM(templateTagsContent);
      const document = dom.window.document;
      const postItemTemplate = document.querySelector('.post-item');
      const postLinksDiv = document.getElementById('post-links-div');
      
      if (!postItemTemplate) {
        throw new Error('Tags template must contain an element with class "post-item"');
      }
      if (!postLinksDiv) {
        throw new Error('Tags template must contain an element with id "post-links-div"');
      }

      // Add each post to the post links container
      pagePosts.forEach((post) => {
        const postItem = createPostItem(
          post,
          postItemTemplate,
          '/blog/posts',
          '/blog/tags',
        );
        postLinksDiv.appendChild(postItem);
      });

      postItemTemplate.remove();
      updatePaginationLinks(document, pageIndex, tagContent, tag);

      // Save the tag page
      const tagElement = document.querySelector('#tag');
      if (!tagElement) {
        throw new Error('Tags template must contain an element with id "tag"');
      }
      const content = tagElement.outerHTML;
      // Sanitize tag for filename
      const filesWithDash = sanitizeFilename(normalizeTagForFile(tag));
      
      const outputFilePath =
        pageIndex === 0
          ? path.join(tempTagsOutputDirectory, `${filesWithDash}.html`)
          : path.join(
              tempTagsOutputDirectory,
              `${filesWithDash}-page-${pageIndex + 1}.html`,
            );
      const filesWithoutDash = denormalizeTagFromFile(tag);
      const modifiedPathBar = `/ <a href=/blog/tags>Tags</a> / <em>${filesWithoutDash}</em>`.replace(/\s+/g, ' ').trim();
      // Add dynamic front matter to the content
      const finalHtml = `${generateFrontMatter({
        page: modifiedPathBar,
        title: filesWithoutDash,
      })}\n${content}`;

      writeFileContent(outputFilePath, finalHtml);
      console.log(`(Tags.js): Generated tag page -> ${outputFilePath}`);

      // Add the link to the tagLinks array for the index page
      if (pageIndex === 0) {
        tagLinks.push({
          tag: filesWithoutDash,
          link: `/blog/tags/${filesWithDash}.html`,
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
      console.error('(Tags.js): Invalid tagLink:', tagLink);
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
  const modifiedPathBar = `/ <em>Tags</em>`.replace(/\s+/g, ' ').trim();
  // Add dynamic front matter to the content
  const finalIndexHtml = `${generateFrontMatter({
    page: modifiedPathBar,
    title: 'Tags',
  })}\n${content}`;

  writeFileContent(mainTagsPath, finalIndexHtml);
  console.log(`(Tags.js): Generated main tags page -> ${mainTagsPath}`);
};
