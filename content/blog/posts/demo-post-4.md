---
title: Template Placeholder Contract (No Surprises)
date: 06.02.2026
tags: [guide, templates, core]
---

# Template Placeholder Contract (No Surprises)

There are two placeholder modes, and each has a different purpose.

## `{{key}}` in main layout rendering

Used by core replacement for layout-level values like:

- `{{title}}`
- `{{children}}`
- `{{canonicalUrl}}`
- `{{tags-dropdown}}`

## `{{{key}}}` in page-specific template injection

Used when injecting raw content into page templates, for example:

- `{{{content}}}`

## Why this split exists

- Keeps layout rendering simple
- Avoids accidental behavior overlap
- Makes template intent explicit

When authoring templates, choose one mode deliberately. It keeps debugging straightforward.
