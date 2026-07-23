# v0.7.0 Release Checklist

## Status

- State: implementation complete; verification and release pending
- Target: `v0.7.0`
- Product: cloneable, private static-site-generator source template
- Runtime: Node 24
- Deployment: contents of `public/` at a domain or subdomain root

## Completed Implementation

- [x] Track a neutral starter config and all starter content.
- [x] Enable the blog and current themes in the starter config.
- [x] Type enabled blog settings against `Config & BlogModuleConfig`.
- [x] Render `content/pages/index.html` directly to `public/index.html`.
- [x] Remove generated `.build/` files from source control.
- [x] Emit `index, follow` for normal pages and `noindex, follow` for the 404
      page.
- [x] Mark the npm project private and align metadata with v0.7.0 and Node 24.
- [x] Add `npm run check` for formatting, linting, tests, and a full build.
- [x] Verify required outputs, root metadata, 404 metadata, and generated local
      links in the build integration test.
- [x] Add Node 24 GitHub Actions CI with a tracked-file mutation check.
- [x] Synchronize the README, blog module docs, agent guidance, starter content,
      and changelog.

## Release Verification

- [x] Run `npm ci` using Node 24.
- [x] Run `npm run check`.
- [ ] Confirm `git diff --exit-code` after a committed release candidate.
- [ ] Confirm the release commit can fast-forward the remote branch.
- [ ] Push the release commit and confirm CI passes.
- [ ] Create and push the annotated `v0.7.0` tag.

## Guardrails

- Keep `core/` generic and module-agnostic.
- Keep blog-specific types, validation, and behavior under `modules/blog/`.
- Preserve the current module contract until a concrete extension needs more.
- Keep generated output out of source control.

## Deferred

- Configurable base paths or project-page subdirectories
- npm package publishing or an installed CLI
- Host-specific deployment automation
- Browser end-to-end, screenshot, or visual-regression infrastructure
- New modules or module APIs
- Module-scoped logger factory
- Visual redesign
