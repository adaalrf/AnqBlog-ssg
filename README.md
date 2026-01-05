# AnqBlog SSG

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A fast, lightweight static site generator that converts Markdown to HTML. Built with Node.js, featuring pagination, tag organization, SEO optimization, and modern tooling.

The build process requires Node.js, but the generated static site can be served on any web server without Node.js.

## Features

- **Markdown to HTML** - Convert Markdown files with YAML front matter to static HTML
- **Template-based Architecture** - Flexible HTML templates for complete design control
- **Pagination** - Automatic pagination for blog listings with configurable posts per page
- **Tag System** - Organize content with tags and generate dedicated tag pages
- **SEO Optimization** - Automatic canonical URLs, Open Graph meta tags, and Twitter card support
- **Dark Mode** - Built-in light/dark theme toggle with persistent user preference
- **Performance Optimized** - Parallel processing, HTML minification, and efficient builds
- **Tailwind CSS** - Modern utility-first CSS framework with custom theme support
- **TypeScript** - Fully type-safe codebase (build scripts and client-side code)
- **Build Progress** - Real-time progress indicators during build process

## Requirements

- **Node.js** v18 or higher
- **npm** or **yarn** package manager

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/adaalrf/anq-blog-ssg.git
cd anq-blog-ssg
npm install
```

Copy the example configuration file:

```bash
cp scripts/example.config.ts scripts/config.ts
```

## Usage

### Create Content

Write blog posts in Markdown and place them in `src/content/blog/posts/`:

```markdown
---
title: 'My First Blog Post'
date: '03.01.2026'  # or use ISO 8601: '2026-01-03'
tags: ['personal', 'introduction']
---

Write your content here.
```

Standalone pages can be added to `src/content/pages/`. These support front matter for metadata.

### Configure

Copy the example configuration file if you haven't already:

```bash
cp scripts/example.config.js scripts/config.js
```

Then edit `scripts/config.ts` to customize your site:

```typescript
const siteConfig = {
  siteName: 'My Blog',                      // Site name displayed in header
  siteDescription: 'My awesome blog',       // Site description for meta tags
  siteUrl: 'https://example.com',           // Base URL (used for canonical URLs and Open Graph)
  githubUrl: 'https://github.com/username', // GitHub profile URL
  authorName: 'username',                   // Author name displayed in footer
  copyrightYear: new Date().getFullYear(),  // Copyright year (auto-updates)
  postsPerPage: 5,                          // Number of posts per paginated page
  previewLength: 200,                       // Character length for post previews
  titleTruncationLength: 25,                // Max title length in post listings
  titleTruncationLengthBreadcrumb: 20,      // Max title length in breadcrumbs
  paginationWindowSize: 5,                  // Number of page links in pagination
  dateLocale: 'en-US',                      // Locale for date formatting (e.g., 'en-US', 'en-GB', 'de-DE', 'fr-FR')
  siteLanguage: 'en',                       // HTML lang attribute (e.g., 'en', 'es', 'fr', 'de')
};
```

### Build

Generate the static site:

```bash
npm run build
```

Output files are generated in the `public/` directory.

### Serve Locally (Development)

Preview the site locally using the built-in Node.js server:

```bash
npm run serve
```

The site will be available at `http://localhost:8080` by default.

**Custom Port:** Set the `PORT` environment variable to use a different port:
```bash
PORT=3000 npm run serve
```

> **Important:** `serve.ts` requires Node.js and is for **local development only**. The built site in `public/` contains only static files (HTML, CSS, JavaScript) and can be served by **any web server without Node.js**.

## Deployment

Deploy the contents of the `public/` directory to any static hosting service. **The generated site requires NO Node.js runtime** - it's pure HTML, CSS, and JavaScript that can be served by any web server (Apache, Nginx, Caddy, etc.) or static hosting service.

### Example: Manual Deployment via SSH

```bash
scp -r public/* user@your-server:/var/www/html/
```

### Example: GitHub Pages

```bash
git subtree push --prefix public origin gh-pages
```

## Project Structure

```
anq-blog-ssg/
├── src/
│   ├── assets/          # Images, icons, favicon
│   ├── content/         # Markdown content files
│   │   ├── blog/posts/  # Blog post markdown files
│   │   └── pages/       # Standalone page files
│   ├── styles/          # Tailwind CSS source
│   ├── templates/       # HTML templates
│   └── ts/              # TypeScript source files
├── scripts/             # Build scripts and utilities (TypeScript source)
│   ├── blog/            # Blog-specific generators
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
│       ├── index.ts     # Core types (Post, ProcessMarkdownOptions, etc.)
│       └── config.ts    # Configuration types
├── dist/                # Compiled JavaScript (generated, gitignored)
├── .build/              # Temporary build artifacts (generated, not committed)
├── public/              # Generated static site (output)
├── build.ts             # Main build orchestrator (TypeScript)
├── serve.ts             # Local development server (TypeScript)
└── package.json         # Dependencies and scripts
```

## Customization

### Templates

Edit files in `src/templates/` to modify the HTML structure and layout:

- `layout-template.html` - Main page wrapper (header, footer, navigation)
- `post-template.html` - Individual blog post layout
- `blog-template.html` - Blog listing page layout
- `tags-template.html` - Tag page layout
- `main-tags-template.html` - Tags index page layout

#### Template Placeholders

The `layout-template.html` supports the following placeholders that are automatically replaced during build:

- `{{siteName}}` - Site name from config
- `{{siteDescription}}` - Site description for meta tags
- `{{siteLanguage}}` - HTML lang attribute (e.g., 'en', 'es', 'fr')
- `{{title}}` - Page title (format: `{{siteName}} | {{pageTitle}}`)
- `{{page}}` - Breadcrumb navigation path (HTML formatted)
- `{{children}}` - Main content area (injected from other templates)
- `{{tagsDropdown}}` - Generated HTML for tags dropdown menu
- `{{githubUrl}}` - GitHub profile URL from config
- `{{authorName}}` - Author name from config
- `{{copyrightYear}}` - Copyright year (auto-updated)
- `{{canonicalUrl}}` - Canonical URL for SEO
- `{{ogUrl}}` - Open Graph URL
- `{{stylesPath}}` - Path to CSS file (`/styles/styles.css`)
- `{{faviconPath}}` - Path to favicon (`/assets/favicon.ico`)
- `{{scriptPath}}` - Path to JavaScript bundle (`/js/bundle.js`)
- `{{gitLogoPath}}` - Path to GitHub icon (`/assets/github-icon.svg`)

Content templates (`post-template.html`, `blog-template.html`, etc.) support:

- `{{content}}` - Full post content (HTML)
- `{{previewContent}}` - Truncated preview content
- `{{title}}` - Post title
- `{{titleLink}}` - Post title as clickable link
- `{{date}}` - Formatted publication date
- `{{tags}}` - Post tags as HTML links

### Styling

Customize styles in `src/styles/tailwind.css` and configure Tailwind in `tailwind.config.js`. The project uses Tailwind's typography plugin for content styling. See the [Tailwind CSS documentation](https://tailwindcss.com/docs) for details.

### Configuration

Copy the example configuration file if you haven't already:

```bash
cp scripts/example.config.ts scripts/config.ts
```

Edit `scripts/config.ts` to customize your site settings. The configuration is split into `siteConfig` (user-facing settings) and `pathConfig` (internal paths). You typically only need to modify `siteConfig`:

```typescript
const siteConfig = {
  siteName: 'My Blog',                    // Site name displayed in header
  siteDescription: 'My awesome blog',     // Site description for meta tags
  siteUrl: 'https://example.com',          // Base URL (used for canonical URLs and Open Graph)
  githubUrl: 'https://github.com/username', // GitHub profile URL
  authorName: 'username',                  // Author name displayed in footer
  copyrightYear: new Date().getFullYear(), // Copyright year (auto-updates)
  postsPerPage: 5,                         // Number of posts per paginated page
  previewLength: 200,                      // Character length for post previews
  titleTruncationLength: 25,               // Max title length in post listings
  titleTruncationLengthBreadcrumb: 20,      // Max title length in breadcrumbs
  paginationWindowSize: 5,                  // Number of page links in pagination
  dateLocale: 'en-US',                      // Locale for date formatting (e.g., 'en-US', 'en-GB', 'de-DE', 'fr-FR')
  siteLanguage: 'en',                       // HTML lang attribute (e.g., 'en', 'es', 'fr', 'de')
};
```

### TypeScript

Add or modify interactive features by editing files in `src/ts/`:

- `toggle-theme.ts` - Theme switcher (light/dark mode)
- `burger-dropdown.ts` - Mobile navigation menu
- `tags-dropdown.ts` - Tags dropdown menu
- `main.ts` - Entry point (auto-generated imports)

## Troubleshooting

### Build fails with "ENOENT" errors

**Solution:** Ensure required directories exist:
- `src/content/blog/posts/` - For blog posts
- `src/templates/` - For HTML templates
- `src/styles/` - For CSS source files

Check that template files are present and verify file permissions.

### CSS not loading

**Solution:** 
1. Run `npm run build` to regenerate CSS
2. Verify that `public/styles/styles.css` exists after build
3. Ensure template paths use absolute paths from root (`/styles/styles.css`)

### Posts not appearing

**Solution:** 
1. Ensure markdown files are in `src/content/blog/posts/`
2. Check front matter format (YAML with `---` delimiters)
3. Verify date format is either:
   - `DD.MM.YYYY` (e.g., `03.01.2026`)
   - ISO 8601: `YYYY-MM-DD` (e.g., `2026-01-03`)
4. Check build output for warnings about missing titles or invalid dates

### Template elements not found

**Solution:** 
1. Ensure templates contain required elements:
   - `#post-content` - For post pages
   - `.post-item` - For blog/tag listings
   - `#post-links-div` - For paginated content
2. Check template file names match expected patterns
3. Review error messages for specific missing elements and file paths

### Theme toggle not visible

**Solution:** 
- On desktop: The theme toggle is in the top navigation bar. If it's hidden, check that the path bar isn't too long (it should truncate automatically)
- On mobile: The theme toggle is in the burger menu dropdown
- Ensure JavaScript is enabled in your browser

## Build Process

The build process includes several optimization steps executed in order:

1. **TypeScript Compilation** - Compiles all TypeScript source files to JavaScript in `dist/` directory
2. **Configuration Validation** - Validates site configuration and paths before building
3. **Import Generation** - Automatically generates TypeScript imports from `src/ts/` directory
4. **Code Bundling** - Bundles TypeScript with Webpack into a single JavaScript file
5. **Asset Copying** - Copies static assets (images, icons, favicon) to output directory
6. **Content Generation** - Processes Markdown files and generates HTML pages with pagination
7. **CSS Processing** - Compiles Tailwind CSS with PostCSS and Autoprefixer
8. **HTML Minification** - Optimizes HTML output (preserves code blocks and whitespace in `<pre>` tags)

Build progress is displayed in real-time, showing the number of posts, pages, and tags being processed. The entire build process is optimized for speed with parallel processing where possible.

**Note:** The `dist/` directory contains compiled JavaScript files and is automatically generated during the build process. It is gitignored and should not be committed to version control.

## Performance

- **Parallel Processing** - Posts are processed concurrently for faster builds
- **HTML Minification** - Reduces file sizes by 10-20% while preserving code blocks
- **Template Caching** - Templates are cached to minimize I/O operations
- **Optimized Output** - Clean, minified HTML, CSS, and JavaScript

## License

MIT License. See `LICENSE` for details.

---

**Author:** [Adaalrf](https://github.com/adaalrf)

For questions, issues, or contributions, please visit the [GitHub repository](https://github.com/adaalrf/anq-blog-ssg).
