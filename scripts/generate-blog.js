const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const truncate = require('html-truncate');
const { JSDOM } = require('jsdom');
const { fr } = require('./resolve-path');
const { log } = require('console');

// Define paths
const postsDirectory = fr('src/posts');
const templatePath = path.join(
  __dirname,
  '../src/templates/blog-template.html',
);
const outputPath = fr('src/content/blog.html');
const configPath = fr('marked.json');

// Read and parse configuration
const markedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
marked.setOptions(markedConfig);

// Utility function to get the first 250 characters of HTML content while preserving structure
const getFirst250Characters = (htmlContent) =>
  truncate(htmlContent, 250, { ellipsis: '...' });

// Read all markdown files in the posts directory
const getPosts = (directory) =>
  fs.readdirSync(directory).filter((file) => file.endsWith('.md'));

// Read a file's content
const readFileContent = (filePath) => fs.readFileSync(filePath, 'utf8');

// Parse and convert markdown to HTML
const parseMarkdown = (fileContent) => {
  const { data, content } = matter(fileContent);
  return { data, htmlContent: marked(content) };
};

// Inject content into template
const injectContentIntoTemplate = (templateContent, posts) => {
  const dom = new JSDOM(templateContent);
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

    // Clone the post item template and fill in the data
    const postItem = postItemTemplate.cloneNode(true);
    postItem.style.display = 'list-item';
    postItem.querySelector('h1').innerHTML = titleLink;
    postItem.querySelector('h2').innerHTML = date;
    postItem.querySelector('.content').innerHTML = previewContent;

    // rewirte the logic, make it more like generate-md-to-htmlFileName.js
    // That also means using gray-matter etc.
    // Handle tags
    /*     const tagsContainer = document.querySelector('.tags');
    const tagDivider = document.getElementById('tag-divider');
    if (tagsContainer) {
      if (tags) {
        const tagsList = tags.map((tag) => `<a href="#">${tag}</a> `).join('');
        tagsContainer.innerHTML = tagsList;
      } else {
        tagsContainer.remove();
        tagDivider.remove();
      }
    } */

    // Append the filled post item to the post-links-div
    postLinksDiv.appendChild(postItem);
  });

  // Remove the template item from the DOM
  postItemTemplate.remove();

  // Extract and return the content within #content-div
  return document.querySelector('#content-div').innerHTML;
};

// Main function to generate the blog.html file
const generateBlogHtml = () => {
  const posts = getPosts(postsDirectory).map((file) => {
    const filePath = path.join(postsDirectory, file);
    const fileContent = readFileContent(filePath);
    const { data, htmlContent } = parseMarkdown(fileContent);

    if (!data.title) {
      throw new Error(`Title is missing in front matter of file: ${file}`);
    }

    return {
      title: data.title,
      date: data.date,
      tags: data.tags || [],
      htmlFileName: file.replace('.md', '.html'),
      previewContent: getFirst250Characters(htmlContent),
    };
  });

  const templateContent = readFileContent(templatePath);
  const updatedContent = injectContentIntoTemplate(templateContent, posts);
  fs.writeFileSync(outputPath, updatedContent);

  console.log(`Generated ${outputPath}`);
};

// Execute the HTML file generation
generateBlogHtml();
