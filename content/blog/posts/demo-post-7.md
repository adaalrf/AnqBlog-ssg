---
title: Static Release Checklist
date: 09.02.2026
tags: [howto, release, deployment]
---

# Static Release Checklist

When using this project as a showpiece, keep the release routine boring and repeatable.

## Checklist

1. Update docs (`README.md`, `CHANGELOG.md`, module docs).
2. Run the quality loop (`npm run check`).
3. Confirm generated output exists in `public/`.
4. Verify `siteUrl` in `core/config/config.ts` is correct for the target domain.
5. Deploy only static output.

Generated URLs assume the site is hosted at a domain or subdomain root.

## Important

`npm run serve` is local-dev only. Do not use it as a production server.

## Result

You get predictable deployments and a repo that stays readable for contributors.
