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
│   └── k-msg/                         # Unified package (re-exports all)
└── apps/                              # Application layer
    ├── cli/                           # Command-line interface
    └── admin-dashboard/               # Web management interface
```

### Package Dependencies & Data Flow
1. **@k-msg/core** - Foundation layer with error handling, retry mechanisms, and base types
2. **@k-msg/provider** - Provider abstraction with IWINV implementation (depends on core)
3. **@k-msg/template** - Template engine with variable substitution (depends on core)
4. **@k-msg/messaging** - Message orchestration (depends on core, provider, template)
5. **@k-msg/channel** - Channel management (depends on core, provider)
6. **@k-msg/analytics** - Metrics collection (depends on core, messaging)
7. **@k-msg/webhook** - Event system (depends on core, analytics)

### Key Architectural Patterns

**Result Pattern**: Most operations return a `Result<T, E>` type:
- `ok(value)` - Success result with data
- `fail(error)` - Failure result with error detail

**Unified Client (KMsg)**: The `KMsg` class provides a unified entry point for all messaging operations:
- `send()` - Send AlimTalk, SMS, or LMS messages
- Integration with template and analytics services

**Adapter-Based Provider System**: The provider system uses adapters to normalize external APIs:
- `IWINVAdapter` - Implementation for IWINV
- Standardized request/result formats (`StandardRequest`, `StandardResult`)

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

### Testing Strategy
```bash
# Run all tests (195+ passing, ~40 skipped)
bun test

# Test specific package
cd packages/provider && bun test

# Run with coverage
bun test --coverage
```

**Test Organization**:
- **Unit Tests**: Fast, isolated tests (all enabled)
- **Integration Tests**: Cross-package interaction tests (enabled)
- **E2E Tests**: External API tests (skipped as `.skip()` - marked as TODO)
- **Provider Tests**: External API dependent tests (skipped for dev environment)

### Package Management
```bash
# Version management (modern bun pm commands)
bun pm version patch|minor|major

# Packaging and publishing
bun run pack:all                    # Create tarballs
bun run publish:all                 # Publish to npm
bun run release                     # Full release process via script
```

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
All errors use the centralized `KMessageError` hierarchy:
```typescript
import { KMessageError, KMessageErrorCode } from '@k-msg/core';

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

// Use TestData and TestAssertions utilities from @k-msg/core:
import { TestData, TestAssertions } from '@k-msg/core';
```

## Common Development Scenarios

### Adding a New Provider
1. Extend `BaseAlimTalkProvider` in `packages/provider/src/`
2. Implement required contracts (messaging, templates, channels, etc.)
3. Add provider-specific types in `types/` subdirectory
4. Create comprehensive tests (unit tests for logic, skip external API tests)
5. Update provider registry and exports

### Working with Templates
Template system supports variable substitution with `#{variableName}` syntax:
```typescript
import { TemplateService } from '@k-msg/template';
import { IWINVAdapter } from '@k-msg/provider';

const adapter = new IWINVAdapter(config);
const templateService = new TemplateService(adapter);

const result = await templateService.create({
  name: 'welcome_message',
  code: 'WELCOME_001',
  content: 'Hello #{name}, welcome to #{service}!',
  category: 'NOTIFICATION'
});
```

### Handling Bulk Operations
The messaging system provides sophisticated bulk processing:
```typescript
import { BulkMessageSender, KMsg } from '@k-msg/messaging';

const kmsg = new KMsg(provider);
const bulkSender = new BulkMessageSender(kmsg);

// Configure fail-fast or continue-on-failure behavior
const result = await bulkSender.sendBulk({
  templateId: 'WELCOME_001',
  recipients: [...],
  options: {
    batchSize: 10,
    batchDelay: 1000
  }
});
```

### Known Issues & Workarounds

**Bun Build CJS Issues**: The project uses dual module format (ESM/CJS) due to known Bun CJS issues:
- Named exports conversion problems ([#12463](https://github.com/oven-sh/bun/issues/12463))
- ESM/CJS interop edge cases ([#5654](https://github.com/oven-sh/bun/issues/5654))
- Strange CJS output behavior ([#14532](https://github.com/oven-sh/bun/issues/14532))

**Test Strategy**: External API tests are intentionally skipped (`.skip()`) to prevent development workflow interruption. They're marked as TODO for E2E environment setup.

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

The project includes an automated release script (`scripts/release.sh`) that:
1. Validates git state (clean working directory, main branch)
2. Runs full test suite
3. Builds all packages
4. Handles version bumping
5. Creates git tags
6. Publishes to npm

Use `bun run release` for interactive release process.
