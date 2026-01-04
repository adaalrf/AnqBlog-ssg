# AnqBlog-ssg

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A static site generator that converts Markdown to HTML. Supports pagination, tag pages, and CSS processing with Tailwind CSS.

The build process requires Node.js, but the generated static site can be served on any web server without Node.js.

## Features

- Markdown to HTML conversion with front matter support
- Template-based page structure
- Pagination for blog listings
- Tag-based content organization
- Dark mode support
- Tailwind CSS processing
- TypeScript bundling

## Requirements

- Node.js v14 or higher
- npm or yarn

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/adaalrf/anq-blog-ssg.git
cd anq-blog-ssg
npm install
```

## Usage

### Create Content

Write blog posts in Markdown and place them in `src/content/blog/posts/`:

```markdown
---
title: 'My First Blog Post'
date: '03.01.2025'
tags: ['personal', 'introduction']
---

Write your content here.
```

Standalone pages can be added to `src/content/pages/`. These support front matter for metadata.

### Configure

Edit `scripts/config.js` to customize your site:

```javascript
const config = {
  siteName: 'My Blog',
  postsPerPage: 5,
  // ...
};
```

### Build

Generate the static site:

```bash
npm run build
```

Output files are generated in the `public/` directory.

### Serve Locally

Preview the site locally:

```bash
npm run serve
```

The site will be available at `http://localhost:8080`.

Note: The local server is for development only. Use a production web server for deployment.

## Deployment

Deploy the contents of the `public/` directory to any static hosting service.

Example deployment:

```bash
scp -r public/* user@your-server:/var/www/html/
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
├── scripts/             # Build scripts and utilities
├── public/              # Generated static site (output)
├── build.js             # Main build script
└── serve.js             # Local development server
```

## Customization

### Templates

Edit files in `src/templates/` to modify the HTML structure and layout.

### Styling

Customize styles in `src/styles/tailwind.css` and configure Tailwind in `tailwind.config.js`. See the [Tailwind CSS documentation](https://tailwindcss.com/docs) for details.

### Configuration

Edit `scripts/config.js` to adjust site name, posts per page, and directory paths.

### TypeScript

Add or modify interactive features by editing files in `src/ts/`.

## Troubleshooting

### Build fails with "ENOENT" errors

Ensure required directories exist: `src/content/blog/posts/`, `src/templates/`, `src/styles/`. Check that template files are present and verify file permissions.

### CSS not loading

Run `npm run build` to regenerate CSS. Verify that `public/styles/styles.css` exists after build and that template paths use absolute paths from root (`/styles/styles.css`).

### Posts not appearing

Ensure markdown files are in `src/content/blog/posts/`. Check front matter format (YAML with `---` delimiters) and verify date format is `DD.MM.YYYY` (e.g., `03.01.2025`).

### Server returns 403 Forbidden

This indicates a path traversal attempt was blocked. Verify you're accessing valid paths within the `public/` directory.

### Template elements not found

Ensure templates contain required elements (e.g., `#post-content`, `.post-item`). Check template file names match expected patterns and review error messages for specific missing elements.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

## License

MIT License. See `LICENSE` for details.
