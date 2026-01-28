# Blog Module

Adds Markdown posts, tags, pagination, RSS, and sitemap generation.

## Enable

In `core/config/config.ts`:

```ts
modules: ['blog'];
```

## Required Config

These keys must be set in `core/config/config.ts`:

- `postsContentDirectory`
- `templatePostsPath`
- `templateBlogPath`
- `templateMainTagsPath`
- `tempPostsOutputDirectory`
- `tempTagsOutputDirectory`
- `tempBlogOutputPath`
- `publicPostsOutputDirectory`
- `publicTagsOutputDirectory`
- `publicBlogOutputPath`
- `postsPerPage`
- `paginationWindowSize`
- `previewLength`

## Content

- Posts: `content/blog/posts/*.md`
- Front matter fields: `title`, `date`, `tags`

## Templates

- `templates/post-template.html`
- `templates/listing-template.html`
- `templates/main-tags-template.html`

## Output

- `public/blog/index.html` and paginated pages
- `public/blog/posts/*.html`
- `public/blog/tags/*.html`
- `public/rss.xml`
- `public/sitemap.xml`
