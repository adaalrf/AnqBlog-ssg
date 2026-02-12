---
title: "Build, Test, Lint: The Minimum Safety Loop"
date: 07.02.2026
tags: [guide, quality, workflow]
---

# Build, Test, Lint: The Minimum Safety Loop

Before every release cut, run the same short loop:

```bash
npm run lint
npm test
npm run build
```

## What each step gives you

- `lint`: catches style and basic correctness issues
- `test`: verifies behavior and regression coverage
- `build`: validates real pipeline output

## Why this order

Lint and tests fail fast. Build confirms end-to-end generation at the end.

## Release policy that scales

If the loop fails, fix before merging.
If it passes, you can cut with confidence and avoid shipping obvious breakage.

For this project size, this loop is usually enough.
