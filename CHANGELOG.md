# Changelog

All notable changes to this project are documented in this file.

The format is inspired by Keep a Changelog and follows Semantic Versioning
intent.

## [Unreleased]

## [0.7.0] - 2026-07-23

### Added

- Added a tracked, neutral starter configuration and content set so a fresh
  clone builds without an initialization step.
- Added `npm run check` to run formatting validation, linting, tests, and a
  complete build.
- Added build integration coverage for required starter output, homepage and
  404 metadata, and every generated internal `href` and `src`.
- Added GitHub Actions validation using Node 24, `npm ci`, the complete check,
  and a tracked-file mutation guard.

### Changed

- Repositioned the project as a cloneable private source template rather than an
  installable npm package.
- Set Node 24 as the supported runtime and aligned Node type definitions.
- Made `core/config/config.ts` the tracked configuration source of truth.
- Mapped `content/pages/` directly to the root of `public/`.
- Refreshed demo blog posts into a current guide, how-to, and development diary
  showcase.
- Documented root-only URL generation and host-neutral deployment of the
  contents of `public/`.

### Fixed

- Corrected homepage canonical and Open Graph URLs to use the configured site
  root.
- Added a configurable page robots value and marked `404.html` as
  `noindex, follow`.
- Core placeholder replacement now supports non-whitespace keys such as
  `{{tags-dropdown}}`.
- The local development server now serves `.jpg` files with the standard
  `image/jpeg` MIME type.
- Document title composition no longer leaves a trailing separator when the
  page title is empty.
- The main layout avoids mobile horizontal overflow from width and horizontal
  margin interaction.
- Mobile and desktop header dropdown menus clamp to the viewport and scroll
  internally, with clearer trigger spacing.

### Removed

- Removed the unreachable configuration-copy bootstrap.
- Removed stale generated `.build/` artifacts from source control.
- Removed npm publication metadata that implied a supported installed-package
  interface.
- Removed an obsolete theme-label styling TODO.

## [0.6.0] - 2026-02-12

This entry summarizes the core-first re-release hardening work.

### Breaking Changes

- Module config boundaries were split: blog-specific config ownership and
  validation moved into `modules/blog` instead of core-owned blog typing.
- Build CLI mode flags were removed; `npm run build` now uses one deterministic
  build path.

### Added

- Core module UI slot API (`context.ui.setSlot`, `context.ui.appendSlot`) for
  layout placeholder injection without core/module coupling.
- Core module lifecycle hooks support (`beforeRun`, `afterRun`) in the module
  runner.
- Core module output manifest support (`generatedPaths`) for diagnostics and
  reporting.
- Reusable module config helper API in
  `core/shared/module-config-api.ts`.
- Shared web path utility in `core/shared/web-path-utils.ts`.
- Focused tests for module runner behavior, module config helpers, CLI builds,
  and layout placeholder behavior.

### Changed

- Core layout application no longer contains module-specific post branching.
- Page and 404 generation share layout metadata assembly.
- The placeholder contract is `{{key}}` for layout replacement and
  `{{{key}}}` for raw content insertion.
- Blog configuration, SEO, navigation, and post orchestration moved into
  module-local services.
- Blog internals receive config explicitly instead of importing the site config.
- CLI build orchestration was deduplicated.

### Fixed

- Normalized mobile menu list markup.
- Quoted test glob patterns for deterministic module test execution.

### Removed

- Removed duplicate blog utilities that overlapped with shared core helpers.
- Removed redundant light-theme overrides; base tokens are the canonical light
  theme source.
