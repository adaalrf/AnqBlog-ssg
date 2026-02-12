# Changelog

All notable changes to this project are documented in this file.

Format is inspired by Keep a Changelog and follows Semantic Versioning intent.

## [Unreleased]

### Fixed

- Core placeholder replacement now supports non-whitespace keys (for example `{{tags-dropdown}}`) instead of only `\w` keys.
- Dev server now serves `.jpg` files with the standard `image/jpeg` MIME type.
- Core document title composition now avoids trailing separators when page title is empty.
- Main layout container now avoids mobile horizontal overflow from width + horizontal margin interaction.

## [0.6.0] - 2026-02-12

This entry summarizes the current re-release hardening work (core-first focus).

### Breaking Changes

- Module config boundaries were split: blog-specific config ownership and validation moved into `modules/blog` instead of core-owned blog typing.
- Build CLI mode flags were removed; `npm run build` now uses one deterministic build path.

### Added

- Core module UI slot API (`context.ui.setSlot`, `context.ui.appendSlot`) for layout placeholder injection without core/module coupling.
- Core module lifecycle hooks support (`beforeRun`, `afterRun`) in the module runner.
- Core module output manifest support (`generatedPaths`) for diagnostics and reporting.
- Reusable module config helper API in `core/shared/module-config-api.ts`.
- Shared web path utility in `core/shared/web-path-utils.ts`.
- New focused tests for:
  - module runner lifecycle/manifest behavior
  - module config helper API
  - CLI build smoke coverage
  - layout/template placeholder behavior and template sanity checks

### Changed

- Core pipeline was further generalized:
  - removed module-specific `posts` branching from layout application
  - unified shared layout placeholder assembly for page and 404 generation
  - clarified placeholder contract (`{{key}}` for layout replacement, `{{{key}}}` for raw content insertion)
- Blog module internals were simplified and made more domain-oriented:
  - extracted config, SEO/feed/sitemap, navigation, and post orchestration into module-local services
  - removed direct imports from `core/config/config.ts` inside blog internals (config is passed explicitly)
- CLI build orchestration was deduplicated and simplified for maintainability.

### Fixed

- Normalized mobile menu list markup in `templates/layout-template.html`.
- Quoted test glob patterns for deterministic module test execution.

### Removed

- Removed duplicate blog-local utilities that overlapped with core shared utilities.
- Removed redundant `styles/themes/light.css` overrides (base tokens are the canonical light theme source).

### Documentation

- Synced architecture and roadmap docs with current core/module separation and API surface.
- Updated README module contract, theming references, and structure notes.
- Kept `TODO.md` phase tracking current through the latest hardening slices.
