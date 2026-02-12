---
title: Static Release Checklist for GitHub Pages
date: 09.02.2026
tags: [howto, release, deployment]
---

# Static Release Checklist for GitHub Pages

When using this project as a showpiece, keep the release routine boring and repeatable.

## Checklist

1. Update docs (`README.md`, `CHANGELOG.md`, module docs).
2. Run quality loop (`lint`, `test`, `build`).
3. Confirm generated output exists in `public/`.
4. Verify `siteUrl` in `core/config/config.ts` is correct for the target domain.
5. Deploy only static output.

## Important

`npm run serve` is local-dev only. Do not use it as a production server.

## Result

You get predictable deployments and a repo that stays readable for contributors.
