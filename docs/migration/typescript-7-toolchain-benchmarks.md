# TypeScript 7 Toolchain Benchmarks

This repository snapshot compares the default `ttsc` path with the TypeScript 7 `tsc` fallback on the same machine and checkout. Validation timings use the median of repeated warm runs; docs and graph rows use one run because they measure different workloads.

Generated on `2026-07-10T00:08:36.431Z` for `darwin-arm64`.

- Bun: `1.3.13`
- `ttsc`: `0.18.1`
- `@ttsc/graph`: `0.18.1`
- `typescript`: `7.0.2`

| Scenario | Command | Runs | Median wall time | Relative to workspace ttsc | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Workspace ttsc | `bun run typecheck` | 3 | `8.221s` | baseline | Canonical workspace validation with type-aware lint diagnostics |
| Workspace tsc fallback | `bun run typecheck:tsc` | 3 | `2.128s` | 3.86x faster | Same target registry through the compiler fallback |
| Focused core ttsc | `bun x ttsc --noEmit --project packages/core/tsconfig.json` | 3 | `0.722s` | 11.39x faster | Small-package edit feedback with ttsc lint enabled |
| Focused core tsc | `bun x tsc --noEmit --project packages/core/tsconfig.json` | 3 | `0.101s` | 81.55x faster | Small-package edit feedback through the fallback compiler |
| Graph architecture gate | `bun run graph:ttsc:check` | 1 | `0.821s` | 10.02x faster | Compiler graph architecture invariant and snapshot validation |
| Docs source generation | `bun run docs:generate` | 1 | `0.704s` | 11.68x faster | Generated CLI, schema, guide, and API inputs |
| Starlight docs build | `bun run docs:build` | 1 | `106.820s` | 12.99x slower | Astro/Starlight build including TypeDoc API pages |

## Interpretation

- `bun run typecheck` is the canonical CI path. It covers packages, CLI, repository tooling, and TypeScript examples, and includes type-aware `@ttsc/lint` diagnostics.
- `bun run typecheck:tsc` is a parity and incident fallback. It checks the same target registry without running ttsc plugins.
- The fallback is faster in this snapshot because `ttsc` starts the semantic plugin host for each project. The default selects combined diagnostics and architecture guarantees rather than claiming a raw compiler-speed win.
- Focused package rows estimate the feedback loop for a small library edit without CLI generation or workspace traversal.
- The graph gate validates package dependency direction, cycles, and the checked-in architecture snapshot; it does not replace typechecking.
- `apps/docs` remains on its local TypeScript 6 compatibility boundary, so docs generation/build timings are reported separately.
- Absolute timings depend on cache and machine state. Re-run `bun run benchmark:ttsc` after toolchain or target-scope changes.

