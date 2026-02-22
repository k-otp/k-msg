# @k-msg/messaging

## 0.22.3 — 2026-02-22

### Patch changes

- [b89c773](https://github.com/k-otp/k-msg/commit/b89c773685a9457e5718bfd4aa8cee9aafdfe063) Add `typeStrategy.timestamp = "date"` support for Cloudflare delivery tracking schema generation on PostgreSQL.
  
  - `renderDrizzleSchemaSource()` now renders Postgres tracking timestamps as `timestamp(..., { withTimezone: true, mode: "date" })` when `date` strategy is selected.
  - SQL schema generation maps Postgres timestamp columns to `TIMESTAMPTZ` for the same strategy.
  - Hyperdrive delivery tracking store now binds timestamp values as `Date` objects for Postgres when `date` strategy is enabled. — Thanks @imjlk!
- Updated dependencies: core@0.22.3, template@0.22.3

## 0.22.2 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.2, template@0.22.2

## 0.22.1 — 2026-02-22

### Patch changes

- [22e0212](https://github.com/k-otp/k-msg/commit/22e0212416885027776910b29a692a50a33c3841) Patch CI failures introduced after `0.22.0` by aligning lint/docs-generated artifacts with repository checks.
  
  - Remove explicit `any` usage in core error utilities.
  - Apply Biome formatting/import cleanup for changed source files.
  - Regenerate CLI help/docs artifacts required by `docs:check`. — Thanks @imjlk!
- Updated dependencies: core@0.22.1, template@0.22.1

## 0.22.0 — 2026-02-22

### Minor changes

- [aa04c40](https://github.com/k-otp/k-msg/commit/aa04c40b7cc608252168008fb66a78c0020c367a) Improve k-msg integration contracts for status normalization, retry policy centralization, and tracking observability.
  
  - Add safer status normalization so unknown provider states do not get finalized as immediate failures.
  - Expand retry/error utilities with policy-based classification and richer provider metadata propagation.
  - Extend send hook lifecycle for queued/retry-scheduled/final outcomes.
  - Add Cloudflare schema rendering options for delivery tracking index-name overrides.
  - Upgrade mock provider scenarios for deterministic timeout/failure/delay testing. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.22.0, template@0.22.0

## 0.21.1 — 2026-02-22

### Patch changes

- [ae66efd](https://github.com/k-otp/k-msg/commit/ae66efd3dc9a5e39a7bdd9ac460cc5e9aee14ee3) Fix delivery tracking schema option typing compatibility.
  
  - Accept legacy `trackingTypeStrategy` input in schema/config paths that previously switched to `typeStrategy`.
  - Ensure `createD1DeliveryTrackingStore`, `createDrizzleDeliveryTrackingStore`, `initializeCloudflareSqlSchema`, and drizzle SQL render helpers honor both option keys.
  - This preserves backward compatibility for existing consumers while keeping the new `typeStrategy` API. — Thanks @imjlk!
- Updated dependencies: core@0.21.1, template@0.21.1

## 0.21.0 — 2026-02-22

### Minor changes

- [47f10ed](https://github.com/k-otp/k-msg/commit/47f10ed37595617a4b9019994670dfb888212d6f) Improve delivery-tracking SQL schema flexibility and privacy defaults.
  
  - Keep default tracking table as `kmsg_delivery_tracking`, with additive schema options:
    `tableName`, `columnMap`, and `typeStrategy`.
  - Add `storeRaw` option across SQL tracking paths (Cloudflare/D1/Drizzle/Hyperdrive/Bun SQL/SQLite).
  - Change SQL default to `storeRaw: false` so provider raw payload is not persisted unless explicitly enabled.
  - Expose `getDeliveryTrackingSchemaSpec()` for SSOT-style schema sync tooling.
  - Add tests for schema rendering and store parity with `storeRaw` on/off.
  - Add docs sync guard (`scripts/docs/sync-tracking-schema-docs.ts`) and refresh messaging/analytics/example docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.21.0, template@0.21.0

## 0.20.0 — 2026-02-21

### Minor changes

- [adb3997](https://github.com/k-otp/k-msg/commit/adb3997754705ad24f7865e73e4bdff0f5a69360) Refactor template handling around `@k-msg/template` as the single runtime source of truth.
  
  ## `@k-msg/template` (minor)
  
  - introduce runtime-first API surface:
    - `TemplateLifecycleService`
    - `TemplatePersonalizer`, `defaultTemplatePersonalizer`, `TemplateVariableUtils`
    - `validateTemplatePayload`, `parseTemplateButtons`
  - split builder/registry/testing helpers to a dedicated subpath: `@k-msg/template/toolkit`
  - remove legacy root exports that overlapped service semantics (`TemplateService`, `MockTemplateService`, root-level builder/registry exports)
  - move personalization implementation from messaging into template package
  
  ## `@k-msg/messaging` (minor)
  
  - remove root personalization exports:
    - `VariableReplacer`
    - `VariableUtils`
    - `defaultVariableReplacer`
  - migration path: import the renamed equivalents from `@k-msg/template`
    - `TemplatePersonalizer`
    - `TemplateVariableUtils`
    - `defaultTemplatePersonalizer`
  
  ## `@k-msg/cli` (minor)
  
  - route `kakao template *` commands through `TemplateLifecycleService` instead of direct provider template method calls
  - apply template runtime validation (`validateTemplatePayload`, `parseTemplateButtons`) before provider requests for create/update flows
  
  ## `@k-msg/provider` (patch)
  
  - remove duplicate template interpolation path in Aligo send by reusing template runtime interpolation
  - apply shared template payload/button validation to Aligo and IWINV template create/update flows
  - normalize Aligo template button serialization through the shared template button parser/serializer — Thanks @imjlk!

### Patch changes

- [99721ca](https://github.com/k-otp/k-msg/commit/99721ca3389c5581b60fdb07f24efc4d03a8e576) Relax `drizzle-orm` peer support for `@k-msg/messaging` to include both `^0.44.0` and `^0.45.0`, while keeping the package's development baseline on `0.45.1`.
  
  Also add CI compatibility matrix coverage for Drizzle adapter flows against:
  
  - `drizzle-orm@0.44.7` (minimum verification target)
  - `drizzle-orm@0.45.1` (maximum verification target) — Thanks @imjlk!
- Updated dependencies: core@0.20.0, template@0.20.0

## 0.19.1 — 2026-02-21

### Patch changes

- [be87ed1](https://github.com/k-otp/k-msg/commit/be87ed17146915a4595bcd7c810c67a1de609cff) Fix Drizzle SQL client rendering for parameterized queries in Cloudflare adapters by returning a Drizzle-compatible query wrapper (`getSQL().toQuery()`) instead of a plain `{ sql, params }` object.
  
  This resolves runtime failures like `query.getSQL is not a function` when `createDrizzleDeliveryTrackingStore` and other Drizzle-backed Cloudflare adapters execute parameterized SQL against Postgres connections. — Thanks @imjlk!
- Updated dependencies: core@0.19.1

## 0.19.0 — 2026-02-19

### Minor changes

- [6a1562f](https://github.com/k-otp/k-msg/commit/6a1562f9e276b16e9125c94e71513b34888a976e) Add Cloudflare SQL schema generation APIs and Drizzle adapter helpers to `@k-msg/messaging`, including reusable SQL/Drizzle schema renderers and improved retry-safe lazy initialization for SQL-backed tracking stores and job queues.
  
  Add `k-msg db schema print` and `k-msg db schema generate` commands to `@k-msg/cli`, using `@k-msg/messaging/adapters/cloudflare` as the single source of truth for generated SQL and Drizzle schema output. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.19.0

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.2

## 0.18.1 — 2026-02-18

### Patch changes

- [f5a1e75](https://github.com/k-otp/k-msg/commit/f5a1e758537e0bab130db3b07591d72010edebd1) Optimization: refactor `KMsg.send(batch)` to use smart batching (provider-specific chunk limits) and remove unsafe type casts in interpolation logic. — Thanks @imjlk!
- Updated dependencies: core@0.18.1

## 0.18.0 — 2026-02-17

### Minor changes

- [373c0d3](https://github.com/k-otp/k-msg/commit/373c0d3b24986159045ddee065a05bfda1935cd3) Unify `KMsg.send` for single and batch inputs with built-in chunking, add configurable persistence strategies (`none`, `log`, `queue`, `full`) via a new message repository contract, and migrate bulk sending internals off `sendMany` to the unified `send` API. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.18.0

## 0.17.0 — 2026-02-17

### Patch changes

- [e03af15](https://github.com/k-otp/k-msg/commit/e03af158dbbc50b9dd9c6196afe56885df1a2848) Remove remaining Node runtime dependencies from analytics/messaging/runtime paths and standardize runtime-neutral environment variable access.
  
  - Replaced Node `events` usage with package-local runtime-neutral `EventEmitter` implementations.
  - Replaced `NodeJS.Timeout` annotations with `ReturnType<typeof setTimeout/setInterval>`.
  - Replaced direct `process.env` reads in core/provider defaults with global-compatible env resolution:
    `globalThis.__K_MSG_ENV__` -> `globalThis.__ENV__` -> `globalThis.process?.env`.
  - Removed `@types/node` from package-level devDependencies where no longer needed. — Thanks @imjlk!
- Updated dependencies: core@0.17.0

## 0.16.0 — 2026-02-17

### Patch changes

- [d0b4040](https://github.com/k-otp/k-msg/commit/d0b404088e5aed87c7b7211a0dab6f36bee2de13) Improve package boundaries and runtime safety across provider/messaging/cli:
  
  - Make package builds deterministic by running `clean` before each build pipeline.
  - Remove stale/unused dependencies and TS references in messaging/webhook/provider.
  - Add `@k-msg/provider/aligo` subpath export and keep `@k-msg/provider/solapi` as a dedicated subpath.
  - Externalize `solapi` from provider dist output while keeping it as optional peer dependency.
  - Update CLI provider registry to lazy-load SOLAPI only when configured, with clear install guidance when missing.
  - Remove unsafe `any` casting from CLI provider capability wiring and add registry boundary tests. — Thanks @imjlk!
- Updated dependencies: core@0.16.0

## 0.15.0 — 2026-02-17

### Patch changes

- [4c44fd6](https://github.com/k-otp/k-msg/commit/4c44fd69c33fc8c6a5ac64da136daeb37daf89ff) Split SOLAPI exports into `@k-msg/provider/solapi` and make `solapi` an optional peer dependency,
  while keeping runtime-neutral exports on `@k-msg/provider`.
  
  Also updated messaging cloudflare DO storage typing compatibility and refreshed docs/examples
  (including advanced Pages routes and new Bun/Express Node send-only templates). — Thanks @imjlk!
- Updated dependencies: core@0.15.0, provider@0.15.0, template@0.15.0

## 0.14.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.14.0, provider@0.14.0, template@0.14.0

## 0.13.0 — 2026-02-16

### Minor changes

- [d6440b8](https://github.com/k-otp/k-msg/commit/d6440b88137510a696cbbbe407f90b9828795599) Restructure messaging APIs into dedicated subpaths and keep the root export send-focused.
  
  - Move delivery-tracking APIs to `@k-msg/messaging/tracking`.
  - Move bulk sender to `@k-msg/messaging/sender`.
  - Move queue contracts to `@k-msg/messaging/queue` and expose `JobStatus` there.
  - Remove these symbols from `@k-msg/messaging` root.
  - Update `k-msg` and analytics internals to consume the new subpaths. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.13.0, provider@0.13.0, template@0.13.0

## 0.12.0 — 2026-02-16

### Minor changes

- [191c4ea](https://github.com/k-otp/k-msg/commit/191c4ea6e037baa7469e0ef7ffe1af8040e2a047) Split runtime-specific messaging implementations into adapter subpaths and keep root APIs runtime-neutral.
  
  - Remove `test-utils` from `@k-msg/core` public exports.
  - Enforce `IWINVProvider` MMS image input as `blob/bytes` only and drop Node-only file/path/buffer dependencies.
  - Add `@k-msg/messaging/adapters/{bun,node,cloudflare}` with Cloudflare support for Hyperdrive/Postgres/MySQL/D1 and KV/R2/DO-backed object adapters.
  - Sync `k-msg/adapters/{bun,node,cloudflare}` re-exports and package export maps. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.12.0, provider@0.12.0, template@0.12.0

## 0.11.0 — 2026-02-16

### Breaking changes

- Runtime-coupled symbols were removed from `@k-msg/messaging` root export:
  - `BunSqlDeliveryTrackingStore`
  - `SqliteDeliveryTrackingStore`
  - `SQLiteJobQueue`
  - `JobProcessor`
  - `MessageRetryHandler`
  - `createDeliveryTrackingHooks`
  - `DeliveryTrackingService`
  - `InMemoryDeliveryTrackingStore`
  - `BulkMessageSender`
  - `Job`
  - `JobQueue`
- Runtime-specific implementations now live under adapter subpaths:
  - `@k-msg/messaging/adapters/bun`
  - `@k-msg/messaging/adapters/node`
  - `@k-msg/messaging/adapters/cloudflare`
- Optional messaging features now live under dedicated subpaths:
  - `@k-msg/messaging/tracking`
  - `@k-msg/messaging/sender`
  - `@k-msg/messaging/queue` (`JobStatus` 포함)
- `JobProcessor` / `MessageJobProcessor` now require explicit `jobQueue` injection.
- Cloudflare adapters now support:
  - Hyperdrive/Postgres/MySQL (driver-injected SQL client)
  - D1 (`createD1SqlClient`/`createD1DeliveryTrackingStore`/`createD1JobQueue`)
  - KV/R2/DO-backed object-store adapters

### Patch changes

- Updated dependencies: core@0.11.0, provider@0.11.0, template@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- Updated dependencies: core@0.10.1, provider@0.10.1, template@0.10.1

## 0.10.0 — 2026-02-16

### Minor changes

- [09fb135](https://github.com/k-otp/k-msg/commit/09fb135888bb5d764f5dc37f8b3555b30db25d09) Formalize provider onboarding specs and add CLI doctor/preflight flow for AlimTalk readiness checks.
  
  Introduce provider onboarding registry metadata, plusId policy enforcement for ALIMTALK send, and opt-in provider live integration workflow scaffolding.
  
  Lock IWINV endpoint handling to built-in defaults (no base URL env/config overrides) and remove those fields from CLI/provider examples and docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.10.0, provider@0.10.0, template@0.10.0

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.9.0, provider@0.9.0, template@0.9.0

## 0.8.0 — 2026-02-15

### Minor changes

- [02d8e88](https://github.com/k-otp/k-msg/commit/02d8e885003795c3a198053514d6598e657ba855) Replace the legacy CLI with a Bunli-based CLI and add Kakao Channel/Template
  management commands. Extend core/provider template APIs (TemplateProvider ctx,
  KakaoChannelProvider, TemplateInspectionProvider) and implement capabilities in
  IWINV/Aligo providers. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.8.0, provider@0.8.0, template@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

- [e9825cf](https://github.com/k-otp/k-msg/commit/e9825cfa0bfdf8c4ec2745c0fa42f46dd4b59a7e) Add query-based delivery tracking analytics.
  
  - `@k-msg/messaging`: extend `DeliveryTrackingStore` with optional query/count APIs and persist provider status/timestamps for reporting.
  - `@k-msg/analytics`: add `DeliveryTrackingAnalyticsService` that computes KPIs/breakdowns by querying a `DeliveryTrackingStore` (SQLite/Bun.SQL/memory). — Thanks @imjlk!
- Updated dependencies: core@0.7.3, provider@0.7.3, template@0.7.3

## 0.7.2 — 2026-02-15

### Patch changes

- Updated dependencies: core@0.7.2, provider@0.7.2, template@0.7.2

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!
- Updated dependencies: core@0.7.1, provider@0.7.1, template@0.7.1

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.7.0, provider@0.7.0, template@0.7.0

## 0.6.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.6.0, provider@0.6.0, template@0.6.0

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.5.0, provider@0.5.0, template@0.5.0

## 0.4.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.4.0, provider@0.4.0, template@0.4.0

## 0.3.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.3.0, provider@0.3.0, template@0.3.0

## 0.2.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.2.0, provider@0.2.0, template@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.1.6, provider@0.1.6, template@0.1.6

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!
- Updated dependencies: core@0.1.5, provider@0.1.5, template@0.1.5

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!
- Updated dependencies: core@0.1.4, provider@0.1.4, template@0.1.4

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!
- Updated dependencies: core@0.1.3, provider@0.1.3, template@0.1.3

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
- Updated dependencies: core@0.1.2, provider@0.1.2, template@0.1.2
