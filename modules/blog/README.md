# Blog Module

Adds Markdown posts, tags, pagination, RSS, and sitemap generation.

## Configuration

The tracked starter enables this module in `core/config/config.ts`:

```ts
modules: ['blog'];
```

When `'blog'` is enabled, the same config file must provide:

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
- optional `maxMarkdownFileSize`

Type a blog-enabled configuration against `Config & BlogModuleConfig` so all
required module keys are checked at compile time.

## Validation and Module Contract

- The module owns its configuration validation and fails fast for missing or
  invalid blog values.
- Validation runs through the core module runner before `run(context)`.
- Core supports optional `beforeRun(context)` and `afterRun(context)` hooks; the
  blog module currently needs only `run(context)`.
- `run(context)` reports its generated public paths through an output manifest.
- Configuration helpers live in `modules/blog/config.ts` and use
  `core/shared/module-config-api.ts`.

## Domain Services

- `modules/blog/domain/posts.ts`: post normalization and sorting
- `modules/blog/domain/navigation.ts`: tag aggregation and dropdown rendering
- `modules/blog/domain/seo.ts`: RSS and sitemap generation
- `core/shared/web-path-utils.ts`: shared file-path to web-path conversion

Blog internals receive configuration through the module context rather than
importing the site config directly.

## Content

Posts live in `content/blog/posts/*.md` and require `title`, `date`, and `tags`
front matter.

## UI Slots

The module injects tag links with
`context.ui.setSlot('tagsDropdown', html)`. Core leaves unspecified slots empty,
so the layout also works with the module disabled.

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

All generated URLs assume deployment at a domain or subdomain root.
