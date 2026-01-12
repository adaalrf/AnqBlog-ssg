# anq-blog-ssg

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

`anq-blog-ssg` is a minimalist static site generator for a Markdown blog + a small set of HTML pages. It runs on Node.js (build-time only) and outputs a fully static site (`public/`) you can host anywhere.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Commands](#commands)
4. [Configuration](#configuration)
5. [Content](#content)
6. [Templates](#templates)
7. [Output](#output)
8. [Deployment](#deployment)
9. [Project Structure](#project-structure)
10. [Troubleshooting](#troubleshooting)
11. [Contributing](#contributing)
12. [License](#license)

## Quick Start

### Requirements
- Node.js 18 or newer
- npm

### Setup
```bash
git clone https://github.com/adaalrf/anq-blog-ssg.git
cd anq-blog-ssg
npm install
```

Create your site config:
```bash
cp scripts/example.config.ts scripts/config.ts
```
Then edit `scripts/config.ts` with your site information (name, description, URLs, pagination, etc.).

Build + preview:
```bash
npm run build
npm run serve
```
Open `http://localhost:8080` (default port). To use a different port, set the `PORT` environment variable: `PORT=3000 npm run serve`.

## Features
- **Markdown posts** with YAML front matter (`src/content/blog/posts/*.md`)
- **Tags + tag index** (`/blog/tags/…`) generated from post front matter
- **Pagination** for blog and tag pages
- **Static pages** as HTML + optional front matter (`src/content/pages/*.html`)
- **SEO outputs**: canonical URLs, Open Graph/Twitter meta tags, `sitemap.xml`, `robots.txt`, `rss.xml`
- **Tailwind CSS** pipeline and a small client bundle (theme toggle + nav)

## Commands
```bash
npm run build                 # Generate the site into public/
npm run build -- --dry-run    # Compile + validate config, no outputs
npm run build -- --incremental # Skip cleaning public/ + .build/
npm run build -- --clean      # Force clean public/ + .build/ before building
npm run build -- --version    # Print package.json version

npm run serve                 # Serve public/ locally (default port: 8080, override with PORT=3000 npm run serve)

npm test
npm run lint
npm run format
```

Notes:
- `scripts/config.ts` is intentionally gitignored; keep your site settings local or manage it in your own repo.
- This repo’s `.gitignore` currently ignores `src/content/*`. If you want to commit your posts/pages, remove that ignore rule.

## Configuration
- Edit `scripts/config.ts` (typed by `scripts/types/config.ts`).
- Common settings:
  - `siteName`, `siteDescription`, `siteUrl`, `siteLanguage`
  - `githubUrl`, `authorName`, `copyrightYear`
  - `postsPerPage`, `paginationWindowSize`
  - `previewLength`, `dateLocale`

## Content

### Blog posts (Markdown)
- Add posts under `src/content/blog/posts/` as `*.md`.
- Front matter supports any fields, but these are commonly used:
  ```yaml
  ---
  title: My First Post
  date: 2026-01-03 # or 03.01.2026
  tags: [personal, launch]
  ---
  ```
- The output filename comes from the source filename (e.g. `my-post.md` → `/blog/posts/my-post.html`).

### Pages (HTML + optional front matter)
- Add pages under `src/content/pages/` as `*.html`. YAML front matter is supported at the top of the file.
- If you create `src/content/pages/index.html`, the build copies it to `public/index.html` so it becomes the site root (`/`).

## Templates
- `src/templates/layout-template.html` wraps every page; placeholders are filled in `scripts/apply-layout.ts`.
- Built-in templates:
  - `src/templates/post-template.html` (post body)
  - `src/templates/listing-template.html` (blog + tag listings)
  - `src/templates/main-tags-template.html` (tags index)
  - `src/templates/404-template.html` (404 page)
- Optional page-specific templates: for `src/content/pages/about.html`, you can add `src/templates/about-template.html`. Inside that template, use `{{{content}}}` to inject the page body.

## Output
The build generates a static site in `public/`, including:
- `public/index.html` (if `src/content/pages/index.html` exists)
- `public/blog/index.html` (+ `blog-page-2.html`, …)
- `public/blog/posts/*.html`
- `public/blog/tags/index.html` (+ `*.html`, `*-page-2.html`, …)
- `public/rss.xml`, `public/sitemap.xml`, `public/robots.txt`, `public/404.html`

## Deployment
Deploy `public/` to any static host (no Node.js runtime required).

- Netlify / Cloudflare Pages / Vercel: build command `npm run build`, output directory `public`
- Any server: copy `public/` to your web root (or upload to object storage + CDN)
- GitHub Pages: use a workflow that builds and publishes `public/` (recommended because `public/` is gitignored)

## Project Structure
```
anq-blog-ssg/
├── scripts/             # Build helpers and generators (TypeScript)
├── src/                 # Content, templates, styles, and client scripts
├── public/              # Generated static site (output)
├── dist/                # Compiled TypeScript output (build artifact)
├── .build/              # Temporary build cache
├── build.ts, serve.ts    # Orchestrators for build and preview
├── package.json         # Scripts, tooling, and dependencies
└── README.md            # This documentation
```

## Troubleshooting
- **Build created `scripts/config.ts` and exited** – That’s first-run behavior when `scripts/config.ts` is missing; edit it and run `npm run build` again.
- **Old pages still in `public/`** – Avoid `--incremental` for release builds, or run `npm run build -- --clean`.
- **Posts not showing up** – Confirm posts are `*.md` under `src/content/blog/posts/` and have unique filenames.
- **Dates look wrong / sorting is wrong** – Use `YYYY-MM-DD` or `DD.MM.YYYY` in front matter.
- **Missing template elements** – Ensure templates still include required selectors like `#post-content`, `.post-item`, `#post-links-div`.

## Contributing
1. Fork the repository and create a branch (`git checkout -b feature/whatever`)
2. Follow the existing TypeScript/HTML/Tailwind conventions
3. Add tests if you introduce logic changes
4. Open a pull request and describe the change

## License
MIT © [Adaalrf](https://github.com/adaalrf)
