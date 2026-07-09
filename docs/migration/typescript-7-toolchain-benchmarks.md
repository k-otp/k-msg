# TypeScript 7 Toolchain Benchmarks

Generated on 2026-07-10T03:51:06+09:00 from the repository root with:

- workspace baseline: current root `typecheck` lane on TS7
- isolated runner: `ttsc@0.18.0`
- graph tool: `@ttsc/graph@0.18.0`

## Validation Lanes

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| Root default typecheck | `bun run typecheck` | pass | `1.562s` | baseline | Current workspace default TS7 lane |
| TS7/ttsc validation lane | `bun run typecheck:ttsc:ts7` | pass | `1.448s` | 1.08x faster | Warm isolated ttsc noEmit lane on TS7 |

## Docs Pipeline Costs

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| API docs generation | `bun run scripts/docs/generate-api-extractor-docs.ts` | pass | `12.431s` | - | Build types plus API Extractor/API Documenter generation for docs-hono API content |
| Hono docs build | `bun run docs-hono:build` | pass | `17.544s` | - | End-to-end Hono docs build including neutral content export and API reference generation |

## Setup And Exploration Costs

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| TS7 runner cold install | `bun run typecheck:ttsc:ts7:install` | pass | `1.100s` | - | Cold install into .cache/ttsc-ts7-runner |
| TS7 graph dump | `bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json` | pass | `3.028s` | - | Warm graph dump for the root workspace tsconfig |

## Reading The Snapshot

- `Relative` is only meant for the validation-lane comparison and uses `bun run typecheck` as the baseline.
- The root lane now uses the default TS7 compiler and includes the current package `build:types` flow plus CLI generation before `tsc --noEmit`.
- The isolated TS7 lane remains a pure `--noEmit` pass over selected package, CLI, and docs-hono tsconfigs.
- The docs rows separate API reference generation cost from the full Hono static-site build cost.
- The graph dump measures analysis startup cost for `ttsc-graph`, not a CI-quality replacement for typecheck.
- Absolute numbers depend on machine state; the checked-in value is mainly useful as a repeatable reference point for this repository.

