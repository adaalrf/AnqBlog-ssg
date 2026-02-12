# Plan Of Attack

## Current Goal
- Keep `core/` stable and generic.
- Push domain behavior and validation into module boundaries.
- Grow reusable module APIs without reintroducing module-specific branches in core.

## Phase 1: Core/Module Separation
- [x] Remove blog-specific runtime behavior from core pipeline.
- [x] Remove blog-specific config types from core type system.
- [x] Move blog validation ownership into `modules/blog`.
- [x] Keep core module loading generic (`Module` contract + runner).

## Phase 2: Domain API Baseline
- [x] Add slot-based UI API: `context.ui.setSlot` / `appendSlot`.
- [x] Add module config helper API: `createModuleConfigApi`.
- [x] Adopt config helper API in blog module.
- [x] Add unit tests for `core/shared/module-config-api.ts`.

## Phase 3: Blog Module Internal Simplification
- [x] Extract blog config validation into `modules/blog/config.ts`.
- [x] Extract blog feed/sitemap generation into `modules/blog/domain/seo.ts`.
- [x] Extract tag/dropdown rendering into `modules/blog/domain/navigation.ts`.
- [x] Reduce orchestration noise in `modules/blog/module.ts` to high-level use cases.

## Phase 4: API Expansion Candidates
- [ ] Add optional module lifecycle hooks (`beforeRun`, `afterRun`) only if needed by a real module.
- [ ] Add optional module output manifest API (module returns generated paths for diagnostics).
- [ ] Add module-scoped logger factory (`context.logger`) to standardize naming and levels.

## Phase 5: Shared Utility Convergence
- [x] Move `filePathToWebPath` into `core/shared` as module-agnostic utility.
- [x] Replace duplicated path-to-web logic in `core/pipeline/apply-layout.ts`.
- [x] Replace blog usage of `modules/blog/utils/path-and-file-utils.ts`.
- [x] Remove module-local duplicate utility and migrate tests to core/shared.

## Guardrails
- No module-specific branching in `core/`.
- If a feature is module-specific, place type/validation/docs under `modules/<name>/`.
- Update `README.md`, `AGENTS.md`, and module README(s) in the same PR as code changes.
