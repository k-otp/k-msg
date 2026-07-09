# TypeScript 7 Toolchain Evaluation

This document records the repository's TypeScript 7 and `ttsc` position without coupling it to the documentation-site runtime.

## Current Position

The publishable packages and CLI use TypeScript 7 as the workspace default. An isolated `ttsc` lane provides a second no-emit validation path and exposes `ttsc-graph` for focused source-code exploration.

The Astro/Starlight documentation workspace is an intentional exception. It installs TypeScript 6 locally because the active TypeDoc integration does not yet support TypeScript 7. The docs site is validated through `bun run docs:check`, not through the TS7 `ttsc` lane.

This split keeps the established documentation experience while allowing the runtime packages and CLI to adopt TS7 independently.

## Commands

```bash
bun run typecheck
bun run typecheck:ttsc:ts7
bun run typecheck:ttsc:ts7:install
bun run typecheck:ttsc:ts7:clean
bun run graph:ttsc:ts7
bun run benchmark:ttsc:ts7
bun run docs:check
```

Compatibility aliases remain available:

```bash
bun run typecheck:ttsc:exp
bun run typecheck:ttsc:exp:install
bun run typecheck:ttsc:exp:clean
```

`graph:ttsc:ts7` passes arguments through to `ttsc-graph`:

```bash
# MCP stdio server
bun run graph:ttsc:ts7

# JSON graph dump
bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json > /tmp/k-msg.graph.json

# Focused package viewer
bun run graph:ttsc:ts7 -- view --tsconfig packages/provider/tsconfig.json
```

## Measured Snapshot

The generated benchmark report is checked in at [typescript-7-toolchain-benchmarks.md](./typescript-7-toolchain-benchmarks.md).

It measures:

- the default root typecheck
- the isolated TS7/`ttsc` validation lane
- documentation source generation
- the full Astro/Starlight and TypeDoc build
- isolated runner setup and `ttsc-graph` startup

The two validation commands do different work. The root command includes declaration generation and CLI preparation, while the `ttsc` lane is a selected-tsconfig `--noEmit` pass. Treat the timing as a repository-specific feedback signal, not a compiler benchmark.

## TS7 Validation Scope

The isolated lane covers:

- `packages/core`
- `packages/template`
- `packages/provider`
- `packages/messaging`
- `packages/analytics`
- `packages/channel`
- `packages/webhook`
- `packages/k-msg`
- `apps/cli`

It excludes `apps/docs`. That workspace owns Astro, Starlight, TypeDoc, generated API pages, and snippet checks under its local TypeScript 6 dependency.

## `ttsc-graph` Boundaries

`ttsc-graph` describes TypeScript symbols and relationships visible through one tsconfig at a time. It is useful for calls, type references, instantiation paths, and package-focused source exploration.

It is not a repository architecture manifest. In particular, it does not model:

- Markdown or MDX content hierarchy
- filesystem-generated routes
- Starlight sidebar and locale structure
- static assets, CSS, or rendered layout
- user journeys and visual regressions

Use a package-level `--tsconfig` for focused code questions. Use the root config only for flows that cross package boundaries, and do not treat a successful graph dump as validation of documentation information architecture or UI quality.

## Why `ttsc` Remains Additive

The default workflow still owns more than no-emit checking:

- declaration output for publishable packages
- CLI runtime generation paired with type validation
- package build and publishing assumptions
- tool-specific validation such as Astro, TypeDoc, and snippet compilation

Biome also remains the repository-wide formatter and linter because it covers JavaScript, JSON, JSONC, and other files outside a TS-only compiler path.

## Documentation Toolchain Boundary

The restored documentation stack is:

- Astro and Starlight for the site shell
- TypeDoc and `starlight-typedoc` for API reference generation
- TypeScript 6 installed locally in `apps/docs`
- TypeScript 7 as the root workspace default

This is a deliberate compatibility boundary. Once TypeDoc and its Starlight integration support TS7, the local compiler pin can be reevaluated without replacing the site runtime.

## Recommendation

1. Keep TypeScript 7 as the package and CLI default.
2. Keep `ttsc` as a fast secondary validation lane.
3. Keep the Starlight docs workspace on local TypeScript 6 until its API tooling supports TS7.
4. Keep Biome as the repository-wide formatter and linter.
5. Use `ttsc-graph` for source-code exploration, not as proof of site architecture.

## External References

- [Announcing TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [ttsc repository](https://github.com/samchon/ttsc)
- [TypeDoc TypeScript 7 tracking issue](https://github.com/TypeStrong/typedoc/issues/3098)
