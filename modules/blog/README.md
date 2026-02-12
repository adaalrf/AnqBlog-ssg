# Blog Module

Adds Markdown posts, tags, pagination, RSS, and sitemap generation.

## Enable

In `core/config/config.ts`:

```ts
modules: ['blog'];
```

## Required Config

These keys must be set in `core/config/config.ts` when the module list includes `'blog'`:

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
- `titleTruncationLength`
- `titleTruncationLengthBreadcrumb`
- `maxMarkdownFileSize` (optional)

## Validation

- The blog module implements `validate(config)` and fails fast if required blog keys are missing or invalid.
- Blog validation is module-owned and runs through the core module runner before `run(context)`.
- Core also supports optional `beforeRun(context)` and `afterRun(context)` hooks; this module currently uses `run(context)` only.
- Validation uses `createModuleConfigApi` from `core/shared/module-config-api.ts`.
- Blog config helpers live in `modules/blog/config.ts`.

## Domain Services

- `modules/blog/domain/posts.ts`: post normalization/sorting use cases.
- `modules/blog/domain/navigation.ts`: tags aggregation and dropdown rendering.
- `modules/blog/domain/seo.ts`: RSS and sitemap generation helpers.
- Pagination uses `filePathToWebPath` from `core/shared/web-path-utils.ts` (shared utility).

## UI Slots

- The module injects tag links through `context.ui.setSlot('tagsDropdown', html)`.
- Core leaves unspecified placeholders empty, so this slot is optional when blog is disabled.

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
