import { generateIntermediatePostHtmlFiles } from './blog/generate-intermediate-posts.js';
import { generatePaginatedBlogHtmlFiles } from './blog/generate-paginated-blog.js';
import { generateTagPages } from './blog/generate-tag-pages.js';
import {
  processMarkdownFiles,
  ensureDirectoryExists,
  replacePlaceholders,
  readFileContent,
  injectContentIntoTemplate,
  parseHtmlFrontMatter,
} from './utils/parsing-utils.js';
import { fr, rp } from './utils/resolve-path.js';
import { parseDate } from './utils/date-utils.js';
import config from './config.js';
import fs from 'fs';
import path from 'path';

// Function to generate tags dropdown HTML
const generateTagsDropdown = (tags, currentFilePath) => {
  if (!currentFilePath) {
    console.error('Error: currentFilePath is undefined.');
    return '';
  }

  return Object.keys(tags)
    .map((tag) => {
      const relativePath = rp(
        path.dirname(currentFilePath),
        `tags/${tag}.html`,
        fr('public/blog'),
      );
      return `<li><a href="${relativePath}" class="dropdown-item">${tag}</a></li>`;
    })
    .join('\n');
};

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(config.tempPostsOutputDirectory);
  ensureDirectoryExists(config.tempTagsOutputDirectory);
  ensureDirectoryExists(config.tempBlogOutputPath);
  ensureDirectoryExists(config.publicContentOutputDirectory);
  ensureDirectoryExists(config.publicBlogOutputPath);
  ensureDirectoryExists(config.publicPostsOutputDirectory);
  ensureDirectoryExists(config.publicTagsOutputDirectory);

  // Ensure all dates are parsed as Date objects
  const posts = processMarkdownFiles(config.postsContentDirectory)
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
    config.templatePostsPath,
    config.tempPostsOutputDirectory,
  );
  generatePaginatedBlogHtmlFiles(
    posts,
    5,
    config.templateBlogPath,
    config.tempBlogOutputPath,
  );
  generateTagPages(
    tags,
    posts,
    config.templateBlogPath,
    config.tempTagsOutputDirectory,
  );

  const directoryPairs = [
    {
      inputDir: config.tempPostsOutputDirectory,
      outputDir: config.publicPostsOutputDirectory,
    },
    {
      inputDir: config.tempTagsOutputDirectory,
      outputDir: config.publicTagsOutputDirectory,
    },
    {
      inputDir: config.tempBlogOutputPath,
      outputDir: config.publicBlogOutputPath,
    },
    {
      inputDir: config.contentDirectory,
      outputDir: config.publicContentOutputDirectory,
    },
  ];

  applyLayoutToHtmlFiles(directoryPairs, tags);
};

// Apply layout to all HTML files in multiple directories
const applyLayoutToHtmlFiles = (directoryPairs, tags) => {
  directoryPairs.forEach(({ inputDir, outputDir }) => {
    const files = fs.readdirSync(inputDir);

    files.forEach((file) => {
      const inputFilePath = path.join(inputDir, file);
      const outputFilePath = path.join(outputDir, file);

      if (file === 'posts') {
        return;
      }

      if (fs.statSync(inputFilePath).isDirectory()) {
        ensureDirectoryExists(outputFilePath);
        applyLayoutToHtmlFiles(
          [{ inputDir: inputFilePath, outputDir: outputFilePath }],
          tags,
        );
      } else if (file.endsWith('.html')) {
        const fileContent = readFileContent(inputFilePath);
        const { data, content } = parseHtmlFrontMatter(fileContent);

        const templateFilePath = path.join(
          fr('src/templates'),
          `${path.basename(file, '.html')}-template.html`,
        );
        const specificTemplateExists = fs.existsSync(templateFilePath);

        let mainContent;
        if (specificTemplateExists) {
          const templateContent = readFileContent(templateFilePath);
          const dom = injectContentIntoTemplate(templateContent, {
            ...data,
            content,
          });
          mainContent = dom.window.document.querySelector('body').innerHTML;
        } else {
          mainContent = content;
        }

        const relativeOutputPath = rp(
          path.dirname(outputFilePath),
          file,
          fr('public'),
        );
        const tagsDropdownContent = generateTagsDropdown(tags, outputFilePath);
        const mainLayoutContent = readFileContent(config.mainLayoutPath);
        const finalHtml = replacePlaceholders(mainLayoutContent, {
          title:
            data.title ||
            path
              .basename(file, '.html')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase()),
          ...data,
          children: mainContent,
          tagsDropdown: tagsDropdownContent, // Add tags dropdown HTML
          stylesPath: path.join(relativeOutputPath, 'styles/styles.css'),
          faviconPath: path.join(relativeOutputPath, 'assets/favicon.webp'),
          scriptPath: path.join(relativeOutputPath, 'js/bundle.js'),
          gitLogoPath: path.join(relativeOutputPath, 'assets/github-icon.svg'),
        });

        fs.writeFileSync(outputFilePath, finalHtml);
        console.log(`(Generate.js): Processed ${outputFilePath}`);
      }
    });
  });
};

// Execute the HTML file generation
generateAllHtmlFiles();
