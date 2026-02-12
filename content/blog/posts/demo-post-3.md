---
title: Theme Tokens and Presets in Practice
date: 05.02.2026
tags: [guide, styling, tokens]
---

# Theme Tokens and Presets in Practice

Styling is token-first:

- Base tokens: `styles/tokens.css`
- Shared structural styles: `styles/base.css`
- Theme overrides: `styles/themes/{dark,rose,mono}.css`

## How switching works

The layout sets theme attributes on `<html>`:

- `data-theme`
- `data-themes`

Client theme toggle scripts read this and swap theme values without changing markup.

## Why token-first helps

- Single source of truth for colors and layout constants
- Lower risk of drift between themes
- Easier visual refactors without touching templates

## Good customization flow

1. Adjust core design tokens first.
2. Add theme-specific overrides only when needed.
3. Keep structural rules in `styles/base.css`, not in theme files.

That keeps visual behavior predictable and maintainable.
