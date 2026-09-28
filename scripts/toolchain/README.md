# Toolchain Scripts

This directory owns the workspace TypeScript 7 validation path.

Primary references live outside this folder:

- [../../docs/migration/typescript-7-ttsc.md](../../docs/migration/typescript-7-ttsc.md)
- [../../docs/migration/typescript-7-toolchain-benchmarks.md](../../docs/migration/typescript-7-toolchain-benchmarks.md)
- [../../docs/architecture/typescript-graph.md](../../docs/architecture/typescript-graph.md)
- [../../docs/architecture/specification-evidence.md](../../docs/architecture/specification-evidence.md)

Key entrypoints:

- [./run-typecheck.ts](./run-typecheck.ts): runs the shared target registry through `ttsc` or `tsc`.
- [./typecheck-targets.ts](./typecheck-targets.ts): records the validation scope and dependency-first order.
- [./run-ttsc-graph.ts](./run-ttsc-graph.ts): exposes the compiler graph CLI and MCP server.
- [./check-ttsc-graph.ts](./check-ttsc-graph.ts): enforces architecture invariants, compiler diagnostics, the specification citation map, and snapshot drift.
- [./entry-boundaries.ts](./entry-boundaries.ts): keeps `@k-msg/messaging` entries from importing the folders behind other subpaths (the root never reaches tracking, queues, or storage adapters), using the files `tsc --listFilesOnly` loads for each entry under the root tsconfig. `check-ttsc-graph.ts` runs it beside the graph dumps.
- [./benchmark-ttsc.ts](./benchmark-ttsc.ts): refreshes the checked-in timing report.

Configuration at the repository root:

- `lint.config.ts`: shared `@ttsc/lint` rules for every program.
- `lint.evidence.config.ts`: extends the shared rules with `@ttsc/evidence` claims.
- `tsconfig.evidence.json`: the root-anchored program that runs the evidence claims.
- `tsconfig.graph.json` / `tsconfig.graph.test.json`: the graph programs; they load the evidence config so cited sections appear in the graph.
- `.mcp.json`: registers the graph MCP server for Claude Code.
