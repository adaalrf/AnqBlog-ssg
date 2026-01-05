import {
  paginatePosts,
  createPostItem,
  updatePaginationLinks,
} from '../utils/pagination-utils.js';
import {
  readFileContent,
  ensureDirectoryExists,
} from '../utils/path-and-file-utils.js';
import { getListingTemplatePath } from '../utils/template-utils.js';
import { generateFrontMatter } from '../utils/content-utils.js';
import config from '../config.js';
import path from 'path';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import type { Post } from '../types/index.js';

/**
 * Generates paginated blog HTML files.
 * @param posts - The array of posts to paginate.
 * @param postsPerPage - The number of posts per page.
 * @param templateBlogPath - The path to the blog template.
 * @param tempBlogOutputPath - The directory to save the paginated blog pages.
 */
export const generatePaginatedBlogHtmlFiles = (
  posts: Post[],
  postsPerPage: number,
  templateBlogPath: string,
  tempBlogOutputPath: string,
): void => {
  ensureDirectoryExists(tempBlogOutputPath);

  const blogContent = paginatePosts(posts, postsPerPage);

  // Ensure at least one page exists (even if empty)
  if (blogContent.length === 0) {
    blogContent.push([]);
  }

  const totalPages = blogContent.length;
  console.log(`(Blog.ts): Generating ${totalPages} blog page${totalPages !== 1 ? 's' : ''}...`);

  // Read the shared listing template
  const listingTemplatePath = getListingTemplatePath();
  let blogTemplateContent = readFileContent(listingTemplatePath);
  // Replace containerId placeholder with 'blog'
  blogTemplateContent = blogTemplateContent.replace(/\{\{containerId\}\}/g, 'blog');

  // Generate each paginated page
  blogContent.forEach((pagePosts, pageIndex) => {
    // Create a fresh DOM instance for each page
    const dom = new JSDOM(blogTemplateContent);
    const document = dom.window.document;
    const postItemTemplate = document.querySelector('.post-item');
    const postLinksDiv = document.getElementById('post-links-div');

    if (!postItemTemplate) {
      throw new Error(
        `Blog template missing required element:\n` +
        `  Element: .post-item\n` +
        `  Template: ${templateBlogPath}\n` +
        `  Listing template: ${listingTemplatePath}\n` +
        `  Page: ${pageIndex + 1}`
      );
    }
    if (!postLinksDiv) {
      throw new Error(
        `Blog template missing required element:\n` +
        `  Element: #post-links-div\n` +
        `  Template: ${templateBlogPath}\n` +
        `  Listing template: ${listingTemplatePath}\n` +
        `  Page: ${pageIndex + 1}`
      );
    }

    // Add only posts for the current page
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

    updatePaginationLinks(document, pageIndex, blogContent, '', config.publicBlogOutputPath, config.publicContentOutputDirectory);
    const blogElement = document.querySelector('#blog');
    if (!blogElement) {
      throw new Error(
        `Blog template missing required element:\n` +
        `  Element: #blog\n` +
        `  Template: ${templateBlogPath}\n` +
        `  Listing template: ${listingTemplatePath}\n` +
        `  Page: ${pageIndex + 1}`
      );
    }
    const content = blogElement.outerHTML;
    const outputFilePath =
      pageIndex === 0
        ? path.join(tempBlogOutputPath, `index.html`)
        : path.join(tempBlogOutputPath, `blog-page-${pageIndex + 1}.html`);

    const modifiedPathBar = `/ <em>Blog</em>`.replace(/\s+/g, ' ').trim();
    // Add dynamic front matter to the content
    const finalHtml = `${generateFrontMatter({
      page: modifiedPathBar,
      title: 'Blog',
    }, {})}\n${content}`;

    fs.writeFileSync(outputFilePath, finalHtml);
    const current = pageIndex + 1;
    console.log(`(Blog.ts): [${current}/${totalPages}] Generated blog page -> ${outputFilePath}`);
  });

  console.log(`(Blog.ts): ✓ Completed generating ${totalPages} blog page${totalPages !== 1 ? 's' : ''}`);
};

