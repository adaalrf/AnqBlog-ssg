# anq-blog-ssg

Minimal static site generator for Markdown blog + HTML pages. Build-time only. Outputs a fully static site in `public/`.

## Requirements

- Node.js 18+
- npm

## Quick Start

```bash
git clone https://github.com/adaalrf/anq-blog-ssg.git
cd anq-blog-ssg
npm install
cp core/config/example.config.ts core/config/config.ts
npm run build
npm run serve
```

Open `http://localhost:8080` (set `PORT=3000` to change).

## Commands

```bash
npm run build
npm run build -- --dry-run
npm run build -- --incremental
npm run build -- --clean
npm run build -- --version

npm run serve
npm test
npm run lint
npm run format
```

## Configuration

- Edit `core/config/config.ts` (typed by `core/types/config.ts`).
- Core config is split into:
  - `CoreSiteConfig` + `CorePathConfig` + `ThemeConfig` + `ModuleConfig`.
  - Module configs (for example `BlogModuleConfig` in `modules/blog/types.ts`) enabled via `modules`.
- `modules` enables optional modules (see module READMEs).
- `core/config/config.ts` is gitignored by default.

Example (`core` only):

```ts
// Core config keys still required.
modules: [];
```

Example (`core` + blog):

```ts
modules: ['blog'];
// include BlogModuleConfig keys from modules/blog/types.ts
// see modules/blog/README.md for required fields
```

## Modules

- Modules live under `modules/` and are enabled by name in `core/config/config.ts`.
- Core works without modules (static pages, `robots.txt`, `404.html`).
- Module config is only required when the module is enabled.
- Module contract: default export with `run(context)` (optionally returns `{ generatedPaths: string[] }`), optional `directoryPairs`, optional `validate(config)`, optional lifecycle hooks `beforeRun(context)` and `afterRun(context)`.
- `context.ui` provides slot helpers (`setSlot`, `appendSlot`) for layout placeholder injection.
- `core/shared/module-config-api.ts` provides reusable helpers for module config validation.
- `core/shared/web-path-utils.ts` provides shared file-path to web-path conversion.
- See module docs for setup: `modules/blog/README.md`.

## Plan

- Active plan and expanded TODOs live in `TODO.md`.

## Content

- Pages: `content/pages/*.html` (front matter supported).
- `content/pages/index.html` becomes `/`.
- Blog content lives under the blog module docs.

## Templates

- Layout: `templates/layout-template.html`.
- 404: `templates/404-template.html`.
- Page templates: `templates/<page>-template.html` with `{{{content}}}`.
- Module templates are documented per module.

## Theming

- Base + tokens: `styles/base.css`, `styles/tokens.css`.
- Themes: `styles/themes/*.css` (applied via `data-theme`).
- Toggle logic: `client/toggle-theme.ts`.

## Output

- Core: `public/robots.txt`, `public/404.html`.
- Module outputs are documented per module.

## Project Structure

```
core/config/ config + validation
core/pipeline/ build pipeline
core/shared/  utilities shared with modules
core/internal/ core-only helpers
modules/blog/utils/ blog-only helpers
core/cli/     build + serve entrypoints
core/types/   shared types
modules/      optional features (blog)
content/     site content
templates/   HTML templates
styles/      Tailwind + tokens
client/      browser bundle
assets/      static assets
public/      build output
```

## Deployment

Deploy `public/` to any static host.

## License

MIT © adaalrf
