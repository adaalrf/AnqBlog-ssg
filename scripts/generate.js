import { generateIntermediatePostHtmlFiles } from './blog/generate-intermediate-posts.js';
import { generateFinalPostHtmlFiles } from './blog/generate-final-posts.js';
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
import { JSDOM } from 'jsdom';

// Main function to generate all HTML files
const generateAllHtmlFiles = () => {
  ensureDirectoryExists(config.postOutputDirectory);
  ensureDirectoryExists(config.publicPostsDirectory);
  ensureDirectoryExists(config.blogOutputPath);
  ensureDirectoryExists(config.tagsOutputDirectory);

  // Ensure all dates are parsed as Date objects
  const posts = processMarkdownFiles(config.postsDirectory)
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
    config.postTemplatePath,
    config.postOutputDirectory,
  );
  generateFinalPostHtmlFiles(
    posts,
    config.mainLayoutPath,
    config.postOutputDirectory,
    config.publicPostsDirectory,
  );
  generatePaginatedBlogHtmlFiles(
    posts,
    5,
    config.blogTemplatePath,
    config.mainLayoutPath,
    config.blogOutputPath,
  );
  generateTagPages(
    tags,
    posts,
    config.blogTemplatePath,
    config.mainLayoutPath,
    config.tagsOutputDirectory,
  );

  applyLayoutToHtmlFiles(
    config.contentDirectory,
    config.publicContentDirectory,
  );
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

// Execute the HTML file generation
generateAllHtmlFiles();
