# TypeScript 7 Toolchain Benchmarks

This repository snapshot compares the default `ttsc` path with the TypeScript 7 `tsc` fallback on the same machine and checkout. Validation timings use the median of repeated warm runs; docs and graph rows use one run because they measure different workloads.

Generated on `2026-09-26T06:32:44.341Z` for `darwin-arm64`.

- Bun: `1.4.0`
- `ttsc`: `0.30.4`
- `@ttsc/lint`: `0.30.4`
- `@ttsc/evidence`: `0.30.4`
- `@ttsc/graph`: `0.30.4`
- `typescript`: `7.0.2`

| Scenario | Command | Runs | Median wall time | Relative to workspace ttsc | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Workspace ttsc | `bun run typecheck` | 3 | `10.871s` | baseline | Canonical workspace validation with type-aware lint diagnostics |
| Workspace tsc fallback | `bun run typecheck:tsc` | 3 | `1.171s` | 9.28x faster | Same target registry through the compiler fallback |
| Focused core ttsc | `bun x ttsc --noEmit --project packages/core/tsconfig.json` | 3 | `1.672s` | 6.50x faster | Small-package edit feedback with ttsc lint enabled |
| Focused core tsc | `bun x tsc --noEmit --project packages/core/tsconfig.json` | 3 | `0.093s` | 117.14x faster | Small-package edit feedback through the fallback compiler |
| Evidence gate | `bun x ttsc --noEmit --project tsconfig.evidence.json` | 3 | `1.922s` | 5.66x faster | Specification coverage and review expiry over the runtime packages |
| Graph architecture gate | `bun run graph:ttsc:check` | 1 | `1.567s` | 6.94x faster | Compiler graph architecture invariant and snapshot validation |
| Docs source generation | `bun run docs:generate` | 1 | `0.555s` | 19.58x faster | Generated CLI, schema, guide, and API inputs |
| Starlight docs build | `bun run docs:build` | 1 | `35.633s` | 3.28x slower | Astro/Starlight build including TypeDoc API pages |

## Interpretation

- `bun run typecheck` is the canonical CI path. It covers packages, CLI, repository tooling, the specification evidence project, and TypeScript examples, and includes type-aware `@ttsc/lint` diagnostics.
- `bun run typecheck:tsc` is a parity and incident fallback. It checks the same target registry without running ttsc plugins.
- The fallback is faster in this snapshot because `ttsc` starts the semantic plugin host for each project. The default selects combined diagnostics and architecture guarantees rather than claiming a raw compiler-speed win.
- Workspace rows run the target registry concurrently (default: available cores, capped at 8; `--concurrency <n>` overrides it) and still print results in dependency order. Machines with fewer cores, such as CI runners, take proportionally longer.
- Focused package rows estimate the feedback loop for a small library edit without CLI generation or workspace traversal.
- The evidence gate checks that every governed specification section is acknowledged and that each review fingerprint still matches the cited text.
- The graph gate validates package dependency direction, cycles, compiler diagnostics, the specification citation map, and the checked-in architecture snapshot; it does not replace typechecking.
- `apps/docs` remains on its local TypeScript 6 compatibility boundary, so docs generation/build timings are reported separately.
- Absolute timings depend on cache and machine state. Re-run `bun run benchmark:ttsc` after toolchain or target-scope changes.

