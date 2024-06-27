const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { fr, rp } = require('./resolve-path');

// Define paths
const layoutTemplatePath = fr('src/templates/layout-template.html');
const contentDirectories = [
  {
    src: fr('src/content'),
    dest: fr('public'),
  },
];

// Ensure output directory exists
const ensureOutputDirectoryExists = (directories) => {
  directories.forEach(({ dest }) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
  });
};

// Read a file's content
const readFileContent = (filePath) => fs.readFileSync(filePath, 'utf8');

// Inject content into the layout template
const injectContentIntoLayout = (
  layoutContent,
  content,
  title,
  relativePath,
) => {
  return layoutContent
    .replace('{{title}}', title)
    .replace('{{children}}', content)
    .replace('{{stylesPath}}', `${relativePath}styles/styles.css`)
    .replace('{{faviconPath}}', `${relativePath}assets/favicon.webp`)
    .replace('{{scriptPath}}', `${relativePath}js/bundle.js`);
};

// Generate HTML for all content files in the directory recursively
const generateHtmlFiles = (directory, outputDir, layoutTemplate) => {
  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const outputFilePath = path.join(outputDir, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      if (!fs.existsSync(outputFilePath)) {
        fs.mkdirSync(outputFilePath, { recursive: true });
      }
      generateHtmlFiles(filePath, outputFilePath, layoutTemplate);
    } else if (file.endsWith('.html') && file !== 'index.html') {
      const content = readFileContent(filePath);

      // Extract front matter from content
      const { data, content: htmlContent } = matter(content);
      const title = data.title || 'Document';

      // Calculate the relative path
      const relativePath = rp(outputFilePath, fr('public'));

      // Inject the content into the layout template
      const finalHtml = injectContentIntoLayout(
        layoutTemplate,
        htmlContent,
        title,
        relativePath,
      );

      // Write the final HTML to the output directory
      fs.writeFileSync(outputFilePath, finalHtml);

      console.log(`Generated ${outputFilePath}`);
    }
  });
};

// Main execution
const main = () => {
  // Read the layout template
  const layoutTemplate = readFileContent(layoutTemplatePath);

  // Ensure output directories exist
  ensureOutputDirectoryExists(contentDirectories);

  // Process each content directory
  contentDirectories.forEach(({ src, dest }) => {
    generateHtmlFiles(src, dest, layoutTemplate);
  });
};

// Execute the main function
main();
