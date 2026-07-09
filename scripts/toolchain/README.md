# TS7 + `ttsc` Experiment

This directory holds the isolated TypeScript 7 / `ttsc` experiment for the `k-msg` workspace.

The goal of the experiment is not to replace the current toolchain immediately.
The goal is to answer three narrower questions with real repository evidence:

1. Can the package and CLI TypeScript surfaces compile under TypeScript 7 today?
2. Does `ttsc` provide a meaningful speed or ergonomics advantage for this repository?
3. What still blocks a repo-wide promotion from the current `tsc` + Biome setup?

## Why Evaluate TypeScript 7

TypeScript 7 is worth evaluating because it changes the performance profile of the compiler and shifts more of the ecosystem toward the new TypeScript-Go based toolchain.

In practical repo terms, this matters because:

- `k-msg` has many package-local `tsc` typecheck/build steps.
- the root `typecheck` lane fans out across several packages plus the CLI.
- faster TypeScript feedback could reduce CI time and make local iteration cheaper.

This experiment intentionally stays small:

- it does **not** replace the root `typecheck` script
- it does **not** replace Biome
- it does **not** try to migrate the docs toolchain

## Why Evaluate `ttsc`

`ttsc` is interesting here for two reasons.

First, it gives us a TypeScript 7-compatible compiler lane that can be exercised today without forcing the whole workspace to switch.

Second, it opens the door to compiler-hosted plugin workflows later:

- semantic lint via `@ttsc/lint`
- possible future transformer/plugin adoption
- a single compiler-backed lane for typecheck-style work

This PR does **not** adopt `@ttsc/lint` or `@ttsc/unplugin` into the main repo workflow.
It only checks whether the repo can sustain an isolated TS7 validation lane.

## Current Repository Constraints

This repo is not a pure TypeScript source tree with a single compiler consumer.

Relevant constraints today:

- root lint/format/check uses Biome, not ESLint or Prettier
- Biome currently covers more than TypeScript:
  - `ts`, `tsx`, `js`, `jsx`
  - `json`, `jsonc`
  - generated and workflow-adjacent files touched by CI
- docs rely on a separate Astro + TypeDoc stack
- `typedoc` and `starlight-typedoc` are still an independent compatibility gate for any TypeScript major promotion

Because of that, replacing the current toolchain wholesale would mix several decisions:

1. compiler upgrade
2. checker replacement
3. lint/format replacement
4. docs compatibility migration

This experiment deliberately isolates only the first two.

## Experimental Scope

The experimental runner is [run-ts7-ttsc.ts](./run-ts7-ttsc.ts).

It does the following:

- prepares an isolated cached runner under `.cache/ttsc-ts7-runner`
- installs:
  - `typescript@7.0.2`
  - `ttsc@0.18.0`
- forces that runner's `node_modules` into module resolution via `NODE_PATH`
- runs `ttsc --noEmit --project <tsconfig>` against:
  - `packages/core`
  - `packages/template`
  - `packages/provider`
  - `packages/messaging`
  - `packages/analytics`
  - `packages/channel`
  - `packages/webhook`
  - `packages/k-msg`
  - `apps/cli`

It intentionally excludes docs because the docs toolchain still depends on a separate TypeDoc/Astro stack.

## Current Commands

The root `package.json` adds three experiment scripts:

```bash
bun run typecheck:ttsc:exp
bun run typecheck:ttsc:exp:install
bun run typecheck:ttsc:exp:clean
```

Recommended usage:

```bash
# run the isolated TS7/ttsc lane
bun run typecheck:ttsc:exp

# preinstall/update the cached runner only
bun run typecheck:ttsc:exp:install

# remove the cached runner
bun run typecheck:ttsc:exp:clean
```

The existing baseline remains unchanged:

```bash
# current default repo lane
bun run typecheck
```

## Current Snapshot

Measured on 2026-07-10 in this repository, on the experiment branch, with a warm cached runner:

| Command | Result | Wall time |
| --- | --- | ---: |
| `bun run typecheck` | pass | `8.141s` |
| `bun run typecheck:ttsc:exp` | pass | `1.701s` |

These numbers are useful, but they are **not** a final apples-to-apples benchmark.

Important caveats:

- the default `typecheck` lane includes the existing package `build:types` flow plus CLI runtime generation before the CLI `tsc --noEmit` pass
- the experimental `ttsc` lane is a pure `--noEmit` validation pass across selected `tsconfig`s
- docs are excluded from the experiment
- the first experimental run is slower because it has to build the cached runner in `.cache/ttsc-ts7-runner`

So the current snapshot supports this conclusion:

- `ttsc` is promising as a fast validation lane here
- the current measurement is enough to justify continued evaluation
- the current measurement is **not** enough to justify replacing the default lane yet

## What Looks Better Already

The experiment is already useful in a few ways.

### 1. Fast secondary signal

The isolated `ttsc` lane can act as a cheap compatibility check for package and CLI surfaces without disturbing the main workflow.

### 2. TypeScript 7 readiness check

It gives a concrete answer to “can the main source packages and CLI compile under TS7 right now?”

At the moment, for the selected targets, the answer is yes.

### 3. Contained risk

The repo does not need to:

- upgrade the workspace catalog to TypeScript 7
- change package peer ranges
- rewrite docs generation
- change lint/format policy

just to learn whether TS7 + `ttsc` is viable.

## What Is Still Worse or Incomplete

This configuration is still an experiment, not a production default.

### 1. Runner indirection

The experiment depends on a cached side runner under `.cache` plus `NODE_PATH` injection.

That is acceptable for experimentation, but it is not as clean as first-class workspace integration.

### 2. Docs are out of scope

The docs stack is still a hard boundary.

Until the TypeDoc/Astro side is confirmed safe under the desired TypeScript version, a repo-wide compiler promotion remains incomplete.

### 3. Biome still wins on non-TS coverage

Even if `@ttsc/lint` becomes attractive later, Biome currently remains the better fit for broad repo formatting/lint coverage across:

- source code
- JSON / JSONC
- CI-adjacent and generated file paths

### 4. Diagnostics comparison is still shallow

This experiment proves “passes vs passes” and gives an early timing snapshot.

It does **not** yet establish:

- how `ttsc` diagnostics differ on real failures
- whether plugin-hosted lint provides better signals than the current setup
- how stable the lane is over time in CI and on contributor machines

## Recommendation

Current recommendation for this repository:

1. Keep this experiment lane.
2. Do not replace the default `typecheck` lane yet.
3. Do not replace Biome with `@ttsc/lint` yet.
4. Revisit promotion only after:
   - repeated successful runs on real PRs
   - clearer diagnostics comparison on failing cases
   - docs/tooling compatibility is re-checked

In short:

- **good enough to keep as an experiment**
- **not yet good enough to become the default**

## Related Files

- [../../package.json](../../package.json)
- [./run-ts7-ttsc.ts](./run-ts7-ttsc.ts)
- [../../apps/docs/package.json](../../apps/docs/package.json)

## External References

- [Announcing TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [ttsc README](https://github.com/samchon/ttsc)
- [TypeDoc TypeScript 7 support tracking](https://github.com/TypeStrong/typedoc/issues/3098)
