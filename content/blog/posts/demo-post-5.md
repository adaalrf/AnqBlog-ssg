---
title: 'Build, Test, Lint: The Minimum Safety Loop'
date: 07.02.2026
tags: [guide, quality, workflow]
---

# Build, Test, Lint: The Minimum Safety Loop

Before every release cut, run the complete project check:

```bash
npm run check
```

## What each step gives you

- `format:check`: keeps source formatting stable
- `lint`: catches style and basic correctness issues
- `test`: verifies behavior and generated output
- `build`: confirms end-to-end generation

## Why this order

Formatting and lint fail fast. Tests exercise a full build, and the final build
confirms end-to-end generation at the end.

## Release policy that scales

If the loop fails, fix before merging.
If it passes, you can cut with confidence and avoid shipping obvious breakage.

For this project size, this loop is usually enough.
