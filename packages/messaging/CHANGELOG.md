# @k-msg/messaging

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
