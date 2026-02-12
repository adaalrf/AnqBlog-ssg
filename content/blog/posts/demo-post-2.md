---
title: "Core vs Modules: The Architecture Boundary"
date: 04.02.2026
tags: [guide, architecture, modules]
---

# Core vs Modules: The Architecture Boundary

The project works best when the boundary is strict:

- `core/` is generic and module-agnostic.
- `modules/<name>/` owns feature behavior, config validation, and outputs.

## What belongs in core

- Config shape shared by all sites
- Build pipeline orchestration
- Layout application and static output generation
- Shared utilities that are truly module-agnostic

## What belongs in a module

- Feature-specific config keys and validation
- Feature-specific templates and domain logic
- Feature-specific output files and route structure

## Why this split matters

- Fewer hidden couplings
- Easier testing and reasoning
- Cleaner extension story for future modules

## Practical rule

If code contains knowledge of a specific feature (for example, blog-specific folder names, fields, or rendering rules), it should live in that module, not in `core/`.
