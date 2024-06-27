const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const grayMatter = require('gray-matter');
const { JSDOM } = require('jsdom');
const { fr, rp } = require('./resolve-path');

// Paths
const configPath = fr('marked.json');
const postsDirectory = fr('src/posts');
const outputDirectory = fr('src/content/posts');
const templateFilePath = fr('src/templates/post-template.html');

// Read and parse configuration
const markedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
marked.setOptions(markedConfig);

// Ensure output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Read template file
const templateContent = fs.readFileSync(templateFilePath, 'utf8');

// Function to apply data to template using JSDOM
const applyTemplate = (template, data) => {
  const dom = new JSDOM(template);
  const document = dom.window.document;

  // Replace placeholders
  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    const value = data[key];
    document.body.innerHTML = document.body.innerHTML.replace(
      placeholder,
      value,
    );
  });

  // Handle tags
  const tagsContainer = document.querySelector('.tags');
  const tagDivider = document.getElementById('post-tag-divider');
  if (tagsContainer) {
    if (data.tags) {
      const tagsList = data.tags
        .map((tag) => `<a href="#">${tag}</a> `)
        .join('');
      tagsContainer.innerHTML = tagsList;
    } else {
      tagsContainer.remove();
      tagDivider.remove();
    }
  }

  // Extract and return the content within the relevant section
  return document.querySelector('#post-content').outerHTML;
};

// Function to process a single markdown file
const processMarkdownFile = (fileName) => {
  const filePath = path.join(postsDirectory, fileName);
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Extract front matter and content
  const { data, content } = grayMatter(fileContent);

  // Convert markdown to HTML
  const htmlContent = marked(content);

  // Apply template
  const filledTemplate = applyTemplate(templateContent, {
    ...data,
    content: htmlContent,
  });

  // Write output file
  const outputFileName = fileName.replace('.md', '.html');
  const outputPath = path.join(outputDirectory, outputFileName);
  fs.writeFileSync(outputPath, filledTemplate);

  console.log(`Generated ${outputPath}`);
};

// Function to generate HTML files from markdown files
const generateHtmlFiles = () => {
  const files = fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md'));
  files.forEach(processMarkdownFile);
};

// Execute the HTML file generation
generateHtmlFiles();
