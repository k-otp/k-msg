# Toolchain Scripts

This directory owns the workspace TypeScript 7 validation path.

Primary references live outside this folder:

- [../../docs/migration/typescript-7-ttsc.md](../../docs/migration/typescript-7-ttsc.md)
- [../../docs/migration/typescript-7-toolchain-benchmarks.md](../../docs/migration/typescript-7-toolchain-benchmarks.md)
- [../../docs/architecture/typescript-graph.md](../../docs/architecture/typescript-graph.md)

Key entrypoints:

- [./run-typecheck.ts](./run-typecheck.ts): runs the shared target registry through `ttsc` or `tsc`.
- [./typecheck-targets.ts](./typecheck-targets.ts): records the validation scope and dependency-first order.
- [./run-ttsc-graph.ts](./run-ttsc-graph.ts): exposes the compiler graph CLI and MCP server.
- [./check-ttsc-graph.ts](./check-ttsc-graph.ts): enforces architecture invariants and snapshot drift.
- [./benchmark-ttsc.ts](./benchmark-ttsc.ts): refreshes the checked-in timing report.
