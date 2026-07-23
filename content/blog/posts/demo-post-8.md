---
title: 'Dev Diary: Finishing the Core/Module Split'
date: 10.02.2026
tags: [dev-diary, architecture, core]
---

# Dev Diary: Finishing the Core/Module Split

Today was about removing the last bits of module knowledge from core.

## What changed

- Core stopped carrying module-specific branching.
- Blog config validation stayed module-owned.
- Shared helpers moved to `core/shared` only when they were truly generic.

## Why it felt right

The build pipeline got easier to reason about. If behavior is blog-specific, there is now one obvious place to find it.

## Next focus

Keep core stable and small. Add APIs only when real module use cases appear.
