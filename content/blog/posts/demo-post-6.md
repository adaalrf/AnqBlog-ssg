---
title: "Module API Primer: validate, run, hooks, outputs"
date: 08.02.2026
tags: [guide, modules, api]
---

# Module API Primer: validate, run, hooks, outputs

Each module exports a default `Module` from `modules/<name>/module.ts`.

## Core contract

- `validate(config)?`
- `beforeRun(context)?`
- `run(context)`
- `afterRun(context)?`
- `directoryPairs?`

`run(context)` can optionally return:

```ts
{ generatedPaths: string[] }
```

## `context` essentials

- `context.config`
- `context.ui.setSlot(slot, content)`
- `context.ui.appendSlot(slot, content)`

## Design guideline

Use hooks and manifests only when you have a concrete need. Keep module code small, explicit, and easy to test.
