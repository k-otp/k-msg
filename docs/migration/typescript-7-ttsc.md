# TypeScript 7 And ttsc Toolchain

This document records the repository's active TypeScript validation architecture, the compatibility boundary around API documentation, and the reasons `ttsc` is the default checker.

## Current Position

TypeScript 7 is the workspace compiler for publishable packages, the CLI, repository tooling, and TypeScript examples. `ttsc` is the canonical no-emit checker used by `bun run typecheck` and CI. The TypeScript 7 `tsc` binary remains available through `bun run typecheck:tsc` as a parity and incident fallback.

The `ttsc`, `@ttsc/lint`, `@ttsc/evidence`, and `@ttsc/graph` packages release in lockstep, so the root `workspaces.catalog` pins them together and Renovate groups them.

Declaration emit still uses package `build:types` scripts. A no-emit checker and a release build have different responsibilities, so adopting `ttsc` does not replace declaration and bundle validation.

The Astro/Starlight documentation workspace is an intentional exception. It installs TypeScript 6 locally because the active TypeDoc integration does not support TypeScript 7 yet. `apps/docs` is validated by `bun run docs:check`, outside the TypeScript 7 target registry.

## Why TypeScript 7 And ttsc

TypeScript 7 moves the compiler and language service to the native implementation. The repository uses that compiler through `ttsc` to combine four capabilities around one resolved TypeScript program:

- regular TypeScript diagnostics across package, CLI, tooling, and example tsconfigs
- type-aware `@ttsc/lint` checks that Biome cannot derive from syntax alone
- specification coverage through `@ttsc/evidence`, which fails the build when a governed document section is unanswered or its review has expired
- compiler-resolved architecture data through `@ttsc/graph`, served to CI and to coding agents

Biome remains the repository-wide formatter and syntax linter for TypeScript, JavaScript, JSON, and JSONC. The root catalog pins its exact version, so `bun run check`, editors, and CI format and lint identically. `@ttsc/lint` is intentionally limited to high-signal semantic rules:

- reject `await` on non-thenable values
- reject `for...in` over arrays and tuples
- require exhaustive union and enum switches, where a `default` clause counts as deliberate coverage

The rules fail the normal typecheck. Promise lifecycle rules were evaluated but not enabled because the current plugin release reports valid cached and assigned Promise values, creating too much noise for a default gate.

`ttsc` 0.19 aligned `typescript/switch-exhaustiveness-check` with typescript-eslint, where a `default` clause no longer covers unlisted union members. `lint.config.ts` sets `considerDefaultExhaustiveForUnions: true` to keep the reviewed gate. Dropping that option is a separate cleanup: every existing switch that relies on `default` would first have to list its remaining members.

## Commands

```bash
# Canonical workspace checker
bun run typecheck

# Targets run in parallel (default: available cores, capped at 8)
bun run typecheck --concurrency 2

# Same target registry through the compiler fallback
bun run typecheck:tsc

# Run both when changing compiler or tsconfig behavior
bun run typecheck:parity

# Focused specification evidence check (also part of bun run typecheck)
bun x ttsc --noEmit --project tsconfig.evidence.json

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
- specification evidence through `tsconfig.evidence.json`
- the six TypeScript Hono examples

The runner resolves the workspace's platform-specific TypeScript 7 binary once and passes it to `ttsc`. Each example's default `tsconfig.json` validates its installed package dependencies independently. CI uses the adjacent `tsconfig.workspace.json` overlay to apply workspace source paths without changing that standalone contract.

The registry is ordered from dependency providers toward consumers. Targets run concurrently because each `ttsc` target pays a fixed type-aware lint sidecar startup, but results print in registry order and no new target starts after a failure, so the first reported failure is still the most upstream one. The checked graph currently confirms the main direction as `core -> template -> provider/messaging -> analytics/k-msg/CLI`; the exact compiler-resolved relationships are checked in at [the TypeScript architecture graph](../architecture/typescript-graph.md).

## Graph Gate

`@ttsc/graph` resolves calls, type references, inheritance, instantiation, and property access through the TypeScript 7 program defined by `tsconfig.graph.json`. The repository turns that index into a narrow CI contract:

- the graph must contain expected anchor relationships
- publishable packages cannot depend on applications, examples, or tooling
- package-level semantic dependencies must be acyclic
- the program must be free of compiler errors outside `examples/`, because edges resolved against an erroneous program cannot be trusted
- governed specification sections must stay indexed as `doc_ref` edges, and the snapshot lists which declaration answers each one
- dependency and citation changes must refresh and review the checked-in snapshot

Raw symbol and edge counts are printed for observability but omitted from the snapshot. That keeps internal refactors from creating documentation churn while still surfacing architecture changes.

Examples are tolerated in the diagnostics check because they need runtime-specific ambient types (Workers, Pages, Durable Objects) that the shared graph program does not load; their `tsconfig.workspace.json` overlays type-check them.

The graph is a source architecture index, not a model of documentation-site routes, Starlight sidebars, localization, CSS, or rendered UI. Documentation information architecture and visuals still require docs generation, build checks, and browser review.

## Specification Evidence

`@ttsc/evidence` makes selected normative documents compile-time obligations, starting with the KR B2B retention baseline. `lint.evidence.config.ts` declares the claims and `tsconfig.evidence.json` runs them as part of `bun run typecheck`. Each citation carries a review fingerprint, so editing a governed section fails the build until the implementation is re-verified.

The governed documents, tag grammar, and update workflow are described in [Specification Evidence](../architecture/specification-evidence.md).

## Graph MCP For Coding Agents

`@ttsc/graph` is also an MCP server exposing one `inspect_typescript_graph` tool. It answers architecture, call-path, and type questions from the compiler-resolved graph instead of file reads, and it includes the specification sections that evidence citations reach.

The checked-in `.mcp.json` registers it for Claude Code as `ttsc-graph` through `bun run --silent graph:ttsc`, which targets `tsconfig.graph.json` from the repository root. Other MCP clients can launch the same command. For example, in the Codex CLI `config.toml`:

```toml
[mcp_servers.ttsc-graph]
command = "bun"
args = ["run", "--silent", "--cwd", "/path/to/k-msg", "graph:ttsc"]
```

The server keeps one resident graph and refreshes changed shards after edits, so a session pays the cold index once.

## Formatting And Syntax Lint

`@ttsc/lint` also ships a formatter (`ttsc format`) and ports of many ESLint rules. At 0.30.4 neither replaces Biome:

- `ttsc format` fixes indentation, statement and block layout, semicolons, quotes, quoted keys, arrow parentheses, bracket spacing, and trailing commas, but leaves the spacing between tokens as written (`{ x:1,y :  [1,2,3] }` and `if(a===1)` survive) and does not wrap an over-long expression. Checking its rules during `bun run typecheck` also panics on mapped types in `format/trailing-comma`.
- About a dozen of Biome's error-level rules, such as `noUnsafeOptionalChaining`, `noAssignInExpressions`, and `useIterableCallbackReturn`, have no working `@ttsc/lint` equivalent, and nothing replaces Biome's unused-import and unused-variable warnings. The ports of `no-unsafe-optional-chaining`, `typescript/no-empty-object-type`, and `typescript/no-explicit-any` make the lint sidecar resolve project references to unbuilt `dist` output (TS6305).

Two formatters would fight over the layouts they disagree on, so Biome keeps both jobs until `ttsc format` normalizes whitespace. Biome does not format Markdown, so Markdown has no formatter.

## Other ttsc Plugins

`@ttsc/lint`, `@ttsc/evidence`, and `@ttsc/graph` are enabled as described above. No transform or bundler plugin is enabled without a current repository requirement:

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
- [`@ttsc/evidence` documentation](https://ttsc.dev/docs/evidence)
- [`@ttsc/graph` documentation](https://github.com/samchon/ttsc/tree/master/packages/graph)
- [TypeDoc TypeScript 7 tracking issue](https://github.com/TypeStrong/typedoc/issues/3098)
