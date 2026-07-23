# Anq Blog SSG

A cloneable source template for a Markdown blog and HTML pages. It builds a
complete static site into `public/` with no server-side runtime.

This project is intended to be cloned and customized. It is not an installable
npm CLI.

## Requirements

- Node.js 24+
- npm

## Quick Start

```bash
git clone <repository-url> anq-blog-ssg
cd anq-blog-ssg
npm ci
```

Customize the tracked site configuration in `core/config/config.ts`, then edit
the starter page and blog posts under `content/`.

```bash
npm run build
```

The deployable site is now in `public/`. To preview it locally:

```bash
npm run serve
```

Open `http://localhost:8080` (set `PORT=3000` to change the local port).
`npm run serve` is for local development only.

## Commands

```bash
npm run build
npm run serve
npm run check
npm test
npm run lint
npm run format
```

`npm run check` runs formatting validation, linting, tests, and a complete build
in the same order used by CI.

## Configuration

`core/config/config.ts` is the tracked source of truth for the starter site. Its
configuration is composed from:

- `CoreSiteConfig`, `CorePathConfig`, `ThemeConfig`, and `ModuleConfig` in
  `core/types/config.ts`
- `BlogModuleConfig` in `modules/blog/types.ts` while the blog module is enabled

The starter enables the blog module and types the complete object against
`Config & BlogModuleConfig`. Module-specific configuration and outputs are
documented in each module README.

`contentDirectory` is the core page root. Its `index.html` maps directly to
`public/index.html` and `/`.

## Content

- Pages: `content/pages/*.html` (HTML front matter is supported)
- Homepage: `content/pages/index.html`
- Blog posts: `content/blog/posts/*.md`

The included `demo-post-*.md` files demonstrate guides, how-to content, and
development notes. Replace them with your own posts.

## Modules

Modules live under `modules/` and are enabled by name in
`core/config/config.ts`. Core works without modules and still generates static
pages, `robots.txt`, and `404.html`.

Each module exports a default object with:

- `run(context)`, optionally returning `{ generatedPaths: string[] }`
- optional `directoryPairs`
- optional `validate(config)`, `beforeRun(context)`, and `afterRun(context)`

`context.ui` provides `setSlot` and `appendSlot` for layout injection. Shared
core/module helpers live under `core/shared/`. See
`modules/blog/README.md` for the included blog module.

## Templates and Themes

- Main layout: `templates/layout-template.html`
- 404 content: `templates/404-template.html`
- Page templates: `templates/<page>-template.html`
- Blog templates: documented in `modules/blog/README.md`
- Base styling: `styles/base.css` and `styles/tokens.css`
- Theme overrides: `styles/themes/{dark,rose,mono}.css`
- Theme switching: `client/toggle-theme.ts`

Page templates use triple-brace placeholders such as `{{{content}}}`. The main
layout uses double-brace placeholders such as `{{title}}` and `{{children}}`.

## Output and Deployment

Core generates:

- `public/index.html`
- `public/404.html`
- `public/robots.txt`
- `public/styles/styles.css`
- `public/js/bundle.js`

The blog module adds blog pages, posts, tags, RSS, and sitemap output.

Generated URLs target a domain or subdomain root. Hosting under a URL
subdirectory or configurable base path is intentionally unsupported in v0.7.0.

Deploy by uploading the contents of `public/` to any static host. Do not deploy
the Node-based local development server.

## Project Structure

```text
core/config/ config + validation
core/pipeline/ build pipeline
core/shared/  utilities shared with modules
core/internal/ core-only helpers
core/cli/     build + local serve entrypoints
core/types/   shared types
modules/      optional features
content/      tracked starter content
templates/    HTML templates
styles/       Tailwind + theme tokens
client/       browser bundle source
assets/       static assets
public/       generated deployable output
```

## Project Status

The active release checklist and deferred work live in `TODO.md`. Release
history lives in `CHANGELOG.md`.

## License

MIT
