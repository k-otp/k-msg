# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

## Platform Overview

K-Message is a comprehensive Korean multi-channel messaging platform built as a monorepo with Bun. It provides unified management for AlimTalk, FriendTalk, SMS, and LMS messaging channels with a focus on performance and developer experience.

## Core Architecture

### Monorepo Structure
```
k-msg-platform/
├── packages/                          # Core library packages
│   ├── core/                          # Base types, errors, retry logic
│   ├── provider/                      # Provider system (IWINV implementation)
│   ├── messaging/                     # Message sending & queue system
│   ├── template/                      # Template parsing & variable substitution
│   ├── channel/                       # Channel & sender number management
│   ├── analytics/                     # Statistics & reporting engine
│   ├── webhook/                       # Event-driven notifications
│   └── k-msg/                         # Unified facade package (currently thin facade)
└── apps/                              # Application layer
    └── cli/                           # Command-line interface
```

### Package Dependencies & Data Flow (Current)
1. **@k-msg/core** - Foundation layer with base types, errors, logger, resilience utilities
2. **@k-msg/provider** - Provider implementations (depends on core)
3. **@k-msg/template** - Template engine and interpolation utilities (depends on core)
4. **@k-msg/messaging** - `KMsg` facade, routing, queue/tracking modules (depends on core)
5. **k-msg** - Public facade package (depends on core and messaging; re-exports `KMsg`, selected core utilities, and runtime adapter subpaths)
6. **@k-msg/analytics** - Tracking-based analytics (depends on core, messaging)
7. **@k-msg/webhook** - Webhook delivery/security (depends on core)
8. **@k-msg/channel** - Channel/sender management (currently standalone package dependency-wise)

### Facade Strategy Guidance (`k-msg`)

Current state: `k-msg` is a **minimal facade** (intentionally small surface).

Recommendation: keep **minimal facade as default policy** for now, and add selective unified exports only when there is repeated DX friction in real consumers.

Rationale:
- Keeps package boundary explicit (`k-msg` for send facade, feature packages for advanced APIs)
- Reduces accidental API lock-in from over-broad re-exports
- Avoids turning `k-msg` into a catch-all package that is harder to evolve semantically

When to consider expanding toward unified facade:
- 3+ real consumers repeatedly import the same core/provider symbols alongside `KMsg`
- onboarding friction appears in issues/docs/support conversations
- re-export candidates can be curated (not wildcard) and versioned with clear compatibility guarantees

### Key Architectural Patterns

**Result Pattern**: Most operations return a `Result<T, E>` type:
- `ok(value)` - Success result with data
- `fail(error)` - Failure result with error detail

**Unified Client (KMsg)**: The `KMsg` class provides a unified entry point for send/routing operations:
- `send()` - Send AlimTalk, SMS, or LMS messages
- `sendMany()` - Batch sending with concurrency control
- Optional hooks/tracking integrations via `@k-msg/messaging/tracking`

**Provider-Based System**: The provider package supplies concrete providers implementing `Provider` contracts from core:
- `IWINVProvider`, `AligoProvider`, `SolapiProvider`, `MockProvider`
- Capability-based optional interfaces (template inspection, kakao channel, balance)

**Error Recovery Strategy**: Multi-layered error handling with:
- Circuit breakers for external API calls
- Exponential backoff retry with jitter
- Bulk operation fail-fast/continue modes
- Centralized error categorization (network, validation, provider-specific)

**Queue Processing**: Messaging uses a sophisticated queue system:
- Single message sender (base operation)
- Bulk message sender (batched operations)
- Job processor with retry mechanisms
- Retry handler with exponential backoff

## Development Commands

### Runtime Commands (Bun-specific)
Default to using Bun instead of Node.js:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv

### Building
```bash
# Build all packages (dual ESM/CJS format with TypeScript declarations)
bun run build:all

# Build specific package
bun run build:core         # or messaging, template, webhook, etc.

# Development mode with watch
bun run dev
```

### Type Checking, Evidence, and Graph (ttsc)
```bash
# Canonical check: TypeScript 7 via ttsc + @ttsc/lint + @ttsc/evidence
bun run typecheck

# Architecture gate: dependency direction, provider contracts, citation map
bun run graph:ttsc:check
bun run graph:ttsc:snapshot   # after an intended dependency or citation change
```

- For code questions (callers, call paths, implementations, where a type is used), prefer the `ttsc-graph` MCP tool (`inspect_typescript_graph`, registered in `.mcp.json`) over grepping. Its answers are compiler-resolved; read files only for function bodies.
- Documents listed in `lint.evidence.config.ts` (currently `docs/compliance/kr-b2b-retention.md`) are governed by `@ttsc/evidence`. When you change a governed section or a declaration that cites one, re-verify the code against the text, then update the `@evidenceReview` fingerprint and statement that `bun run typecheck` reports. Never update a fingerprint without re-checking. Details: `docs/architecture/specification-evidence.md`.
- Biome (pinned in the root catalog) formats and syntax-lints everything; run `bun run check` (CI uses `--diagnostic-level=error`) or `bun run format`. Do not invoke `bun x biome`: that resolves an unrelated npm package.
- Toolchain background and commands: `docs/migration/typescript-7-ttsc.md`.

### Testing Strategy
```bash
# Run every test from the repository root
bun test

# Test specific package (what CI runs, once per package)
cd packages/provider && bun test
bun run test:unit

# Live provider tests only
bun run test:integration

# Run with coverage (opt-in; no threshold)
bun test --coverage
```

**Test Organization**:
- **Unit and cross-package tests**: `*.test.ts` beside the source, run by `bun test` and `test:unit`.
- **Live provider tests**: `packages/provider/src/*/provider.integration.test.ts`. They pass as no-ops unless `KMSG_LIVE_<PROVIDER>_ENABLED=true` and the provider credentials are set (`KMSG_LIVE_<PROVIDER>_ALLOW_MUTATION=true` also allows writes); `.github/workflows/provider-live.yml` runs them.
- `bun test` does not understand Jest flags such as `--testPathPattern` or `--testTimeout` and ignores them silently: filter with positional path patterns and use `--timeout`.

### Package Management
```bash
# Record a release note for changes under packages/* or apps/cli
sampo add                           # writes .sampo/changesets/*.md

# Inspect packages without publishing
bun run pack:dry
```

Versions are managed by Sampo, not `bun pm version`; see Release Process.

### Environment Setup
Required environment variables for IWINV provider:
```bash
IWINV_API_KEY="your-api-key"
```

## APIs and Conventions

### Bun-Specific APIs
- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`
- `Bun.redis` for Redis. Don't use `ioredis`
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`
- `WebSocket` is built-in. Don't use `ws`
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa

### Error Handling Patterns
All errors use the centralized `KMsgError` hierarchy:
```typescript
import { KMsgError, KMsgErrorCode } from '@k-msg/core';

// Specific error types available:
// - ProviderError (provider failures)
// - TemplateError (template processing)
// - MessageError (message sending)
// - ValidationError (input validation)
```

### Testing Patterns
```typescript
import { test, expect } from "bun:test";

// Unit test example
test("hello world", () => {
  expect(1).toBe(1);
});
```

## Common Development Scenarios

### Adding a New Provider
1. Follow `packages/provider/src/PROVIDER_STRUCTURE.md` and existing provider layout (`aligo`, `iwinv`, `solapi`)
2. Implement `Provider` contract and optional capabilities from `@k-msg/core`
3. Expose provider via `packages/provider/src/index.ts` and subpath exports if needed
4. Add tests (unit/integration first; external live tests can remain skipped with TODO)
5. Update onboarding spec mapping in `packages/provider/src/onboarding/specs.ts`

### Working with Templates
Template system supports variable substitution with `#{variableName}` syntax:
```typescript
import { interpolate } from '@k-msg/template';

const rendered = interpolate('Hello #{name}, welcome to #{service}!', {
  name: 'Jane',
  service: 'K-Message',
});
```

### Handling Bulk Operations
Use `KMsg.sendMany()` for controlled batch sending:
```typescript
import { KMsg } from '@k-msg/messaging';

const kmsg = new KMsg({ providers: [provider] });

const result = await kmsg.sendMany(
  [
    { to: '01011112222', text: 'hello 1' },
    { to: '01033334444', text: 'hello 2' },
  ],
  { concurrency: 10 },
);
```

### Known Issues & Workarounds

**Bun Build CJS Issues**: The project uses dual module format (ESM/CJS) due to known Bun CJS issues:
- Named exports conversion problems ([#12463](https://github.com/oven-sh/bun/issues/12463))
- ESM/CJS interop edge cases ([#5654](https://github.com/oven-sh/bun/issues/5654))
- Strange CJS output behavior ([#14532](https://github.com/oven-sh/bun/issues/14532))

**Test Strategy**: Live provider tests are gated by `KMSG_LIVE_*` environment variables instead of `.skip()`, so the default run never calls external APIs.

**Frontend Development**
Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

```typescript
// Server setup
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  development: {
    hmr: true,
    console: true,
  }
});
```

## Release Process

Releases are automated by `.github/workflows/release.yml` and Sampo (`.sampo/README.md`):
1. Feature PRs carry Sampo changesets in `.sampo/changesets/`.
2. After merges to `main`, the workflow keeps a `sampo/release` PR that bumps the lockstep versions and changelogs.
3. Merging that PR publishes every package through npm trusted publishing (OIDC, `scripts/publish-oidc.sh`) and tags the release.

Do not publish from a local machine: it bypasses the changelog and provenance of the release workflow.
