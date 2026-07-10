# TypeScript 7 And ttsc Toolchain

This document records the repository's active TypeScript validation architecture, the compatibility boundary around API documentation, and the reasons `ttsc` is the default checker.

## Current Position

TypeScript 7 is the workspace compiler for publishable packages, the CLI, repository tooling, and TypeScript examples. `ttsc` is the canonical no-emit checker used by `bun run typecheck` and CI. The TypeScript 7 `tsc` binary remains available through `bun run typecheck:tsc` as a parity and incident fallback.

Declaration emit still uses package `build:types` scripts. A no-emit checker and a release build have different responsibilities, so adopting `ttsc` does not replace declaration and bundle validation.

The Astro/Starlight documentation workspace is an intentional exception. It installs TypeScript 6 locally because the active TypeDoc integration does not support TypeScript 7 yet. `apps/docs` is validated by `bun run docs:check`, outside the TypeScript 7 target registry.

## Why TypeScript 7 And ttsc

TypeScript 7 moves the compiler and language service to the native implementation. The repository uses that compiler through `ttsc` to combine three capabilities around one resolved TypeScript program:

- regular TypeScript diagnostics across package, CLI, tooling, and example tsconfigs
- type-aware `@ttsc/lint` checks that Biome cannot derive from syntax alone
- compiler-resolved architecture data through `@ttsc/graph`

Biome remains the repository-wide formatter and syntax linter. It covers JavaScript, JSON, JSONC, and other assets that a TypeScript compiler plugin does not own. `@ttsc/lint` is intentionally limited to high-signal semantic rules:

- reject `await` on non-thenable values
- reject `for...in` over arrays and tuples
- require exhaustive union and enum switches

The rules fail the normal typecheck. Promise lifecycle rules were evaluated but not enabled because the current plugin release reports valid cached and assigned Promise values, creating too much noise for a default gate.

## Commands

```bash
# Canonical workspace checker
bun run typecheck

# Same target registry through the compiler fallback
bun run typecheck:tsc

# Run both when changing compiler or tsconfig behavior
bun run typecheck:parity

# Validate or deliberately refresh the architecture snapshot
bun run graph:ttsc:check
bun run graph:ttsc:snapshot

# Start the graph MCP server or use a focused graph command
bun run graph:ttsc
bun run graph:ttsc -- dump --tsconfig packages/provider/tsconfig.json
bun run graph:ttsc -- view --tsconfig packages/provider/tsconfig.json

# Refresh measured results
bun run benchmark:ttsc
bun run benchmark:ttsc --quick --runs 1
```

The old `typecheck:ttsc:ts7`, `graph:ttsc:ts7`, and `benchmark:ttsc:ts7` names remain aliases for one transition period. They no longer create an isolated compiler installation.

## Validation Scope

The shared target registry covers:

- all publishable packages under `packages/*`
- `apps/cli`, after its generated command registry is refreshed
- repository TypeScript scripts through `tsconfig.tooling.json`
- the six TypeScript Hono examples

The runner resolves the workspace's platform-specific TypeScript 7 binary once and passes it to `ttsc`. The examples keep standalone package manifests with their own TypeScript, `ttsc`, and `@ttsc/lint` declarations while CI validates them from the root installation.

The registry is ordered from dependency providers toward consumers. The checked graph currently confirms the main direction as `core -> template -> provider/messaging -> analytics/k-msg/CLI`; the exact compiler-resolved relationships are checked in at [the TypeScript architecture graph](../architecture/typescript-graph.md).

## Graph Gate

`@ttsc/graph` resolves calls, type references, inheritance, instantiation, and property access through the TypeScript 7 program defined by `tsconfig.graph.json`. The repository turns that index into a narrow CI contract:

- the graph must contain expected anchor relationships
- publishable packages cannot depend on applications, examples, or tooling
- package-level semantic dependencies must be acyclic
- dependency changes must refresh and review the checked-in snapshot

Raw symbol and edge counts are printed for observability but omitted from the snapshot. That keeps internal refactors from creating documentation churn while still surfacing architecture changes.

The graph is a source architecture index, not a model of Markdown routes, Starlight sidebars, localization, CSS, or rendered UI. Documentation information architecture and visuals still require docs generation, build checks, and browser review.

## Other ttsc Plugins

No transform or bundler plugin is enabled without a current repository requirement:

- `@ttsc/paths` is unnecessary because Bun and package builds already resolve the existing aliases.
- `@ttsc/strip` would change emitted public artifacts and needs a separate API policy decision.
- `@ttsc/unplugin` is unnecessary while no runtime transformer must run inside the bundler.
- runtime validators and code generators such as Typia should be evaluated per public boundary rather than enabled workspace-wide.

This keeps the default checker useful without coupling runtime output to an unneeded transform pipeline.

## Measured Results

The generated [toolchain benchmark report](./typescript-7-toolchain-benchmarks.md) compares the canonical `ttsc` path, the `tsc` fallback, focused package checks, the graph gate, and the independent docs pipeline. The report uses repeated warm runs for compiler comparisons and should be regenerated after changing compiler versions, lint plugins, or target scope.

## Compatibility Boundary

The docs stack remains:

- Astro and Starlight for the site shell
- TypeDoc and `starlight-typedoc` for API reference generation
- TypeScript 6 installed locally in `apps/docs`
- TypeScript 7 and `ttsc` everywhere in the root validation registry

Once TypeDoc and its Starlight integration support TypeScript 7, the local pin can be reevaluated without replacing the documentation site.

## References

- [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [ttsc repository and plugin overview](https://github.com/samchon/ttsc)
- [`@ttsc/lint` documentation](https://github.com/samchon/ttsc/tree/master/packages/lint)
- [`@ttsc/graph` documentation](https://github.com/samchon/ttsc/tree/master/packages/graph)
- [TypeDoc TypeScript 7 tracking issue](https://github.com/TypeStrong/typedoc/issues/3098)
