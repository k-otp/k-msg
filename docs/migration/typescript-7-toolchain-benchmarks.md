# TypeScript 7 Toolchain Benchmarks

Generated on 2026-07-10T00:52:39+09:00 from the repository root with:

- workspace baseline: current root `typecheck` lane
- isolated runner: `ttsc@0.18.0`
- graph tool: `@ttsc/graph@0.18.0`

## Validation Lanes

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| Root default typecheck | `bun run typecheck` | pass | `8.408s` | baseline | Current workspace default lane |
| TS7/ttsc validation lane | `bun run typecheck:ttsc:ts7` | pass | `2.193s` | 3.83x faster | Warm isolated TS7/ttsc lane |

## Setup And Exploration Costs

| Scenario | Command | Result | Wall time | Relative to `bun run typecheck` | Notes |
| --- | --- | --- | ---: | ---: | --- |
| TS7 runner cold install | `bun run typecheck:ttsc:ts7:install` | pass | `0.349s` | - | Cold install into .cache/ttsc-ts7-runner |
| TS7 graph dump | `bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json` | pass | `2.348s` | - | Warm graph dump for the root workspace tsconfig |

## Reading The Snapshot

- `Relative` is only meant for the validation-lane comparison and uses `bun run typecheck` as the baseline.
- The root lane includes the current package `build:types` flow plus CLI generation before `tsc --noEmit`.
- The isolated TS7 lane is a pure `--noEmit` pass over selected package and CLI tsconfigs.
- The graph dump measures analysis startup cost for `ttsc-graph`, not a CI-quality replacement for typecheck.
- Absolute numbers depend on machine state; the checked-in value is mainly useful as a repeatable reference point for this repository.

