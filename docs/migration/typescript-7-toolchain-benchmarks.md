# TypeScript 7 Toolchain Benchmarks

Generated on 2026-07-10T08:22:40+09:00 from the repository root with:

- workspace baseline: current root `typecheck` lane on TS7
- isolated runner: `ttsc@0.18.0`
- graph tool: `@ttsc/graph@0.18.0`

## Validation Lanes

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| Root default typecheck | `bun run typecheck` | pass | `1.514s` | baseline | Current workspace default TS7 lane |
| TS7/ttsc validation lane | `bun run typecheck:ttsc:ts7` | pass | `1.317s` | 1.15x faster | Warm isolated ttsc noEmit lane on TS7 |

## Docs Pipeline Costs

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| Docs source generation | `bun run docs:generate` | pass | `0.656s` | - | Generated CLI, schema, guide, and TypeDoc entrypoint inputs |
| Starlight docs build | `bun run docs:build` | pass | `95.483s` | - | End-to-end Astro/Starlight build including TypeDoc API pages |

## Setup And Exploration Costs

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| TS7 runner cold install | `bun run typecheck:ttsc:ts7:install` | pass | `1.223s` | - | Cold install into .cache/ttsc-ts7-runner |
| TS7 graph dump | `bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json` | pass | `2.580s` | - | Warm graph dump for the root workspace tsconfig |

## Reading The Snapshot

- `Relative` is only meant for the validation-lane comparison and uses `bun run typecheck` as the baseline.
- The root lane now uses the default TS7 compiler and includes the current package `build:types` flow plus CLI generation before `tsc --noEmit`.
- The isolated TS7 lane remains a pure `--noEmit` pass over selected package and CLI tsconfigs.
- The docs rows separate generated source preparation from the full Astro/Starlight and TypeDoc build cost.
- The graph dump measures analysis startup cost for `ttsc-graph`, not a CI-quality replacement for typecheck.
- Absolute numbers depend on machine state; the checked-in value is mainly useful as a repeatable reference point for this repository.

