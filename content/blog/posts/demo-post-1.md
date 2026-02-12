---
title: "Quickstart: Build and Ship with anq-blog-ssg"
date: 03.02.2026
tags: [guide, quickstart, core]
---

# Quickstart: Build and Ship with anq-blog-ssg

This generator is intentionally simple: build static files once, then deploy the `public/` directory anywhere.

## 1) Configure the project

Copy the example config and edit values:

```bash
cp core/config/example.config.ts core/config/config.ts
```

Set at least:

- `siteName`
- `siteDescription`
- `siteUrl`
- `modules`

If you enable `modules: ['blog']`, also add the blog keys documented in `modules/blog/README.md`.

## 2) Add content

- Pages: `content/pages/*.html`
- Blog posts: `content/blog/posts/*.md`

A page file can include front matter and optional page-specific template usage.
A blog post requires front matter (`title`, `date`, `tags`) and Markdown body.

## 3) Build and validate

Run:

```bash
npm run build
npm test
npm run lint
```

The build writes static output to `public/`.

## 4) Local preview

Use:

```bash
npm run serve
```

This is local-dev only. Production should serve static files directly from `public/`.

## 5) Deploy

Upload `public/` to GitHub Pages, Netlify, Cloudflare Pages, or any static host.

That is the entire workflow: configure, write, build, deploy.
