# @k-msg/analytics

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.2, messaging@0.18.2

## 0.18.1 — 2026-02-18

### Patch changes

- Updated dependencies: core@0.18.1, messaging@0.18.1

## 0.18.0 — 2026-02-17

### Patch changes

- Updated dependencies: core@0.18.0, messaging@0.18.0

## 0.17.0 — 2026-02-17

### Minor changes

- [74549ef](https://github.com/k-otp/k-msg/commit/74549ef4ea2e9072829fb3ca7bf6aa145e91af90) Reorganize low-usage core APIs and expand real internal usage paths.
  
  - Removed `@k-msg/core` low-usage APIs: `config`, `health`, `types/history`, and high-level resilience helpers (`ErrorRecovery`, `GracefulDegradation`, `HealthMonitor`).
  - Added optional provider capability `BalanceProvider#getBalance(query?)` and implemented it in:
    - `IWINVProvider` (`ALIMTALK` default + `SMS/LMS/MMS` charge lookup)
    - `SolapiProvider` (single balance model mapped to `BalanceResult`)
  - Standardized analytics runtime logging to `@k-msg/core` logger (`console.*` removal in runtime paths).
  - Removed `apps/admin-dashboard` and `apps/message-service` from the monorepo.
  
  Note: This includes behavior/interface removals that can be considered breaking, but this release is intentionally marked as `minor` per current release policy request. — Thanks @imjlk!

### Patch changes

- [e03af15](https://github.com/k-otp/k-msg/commit/e03af158dbbc50b9dd9c6196afe56885df1a2848) Remove remaining Node runtime dependencies from analytics/messaging/runtime paths and standardize runtime-neutral environment variable access.
  
  - Replaced Node `events` usage with package-local runtime-neutral `EventEmitter` implementations.
  - Replaced `NodeJS.Timeout` annotations with `ReturnType<typeof setTimeout/setInterval>`.
  - Replaced direct `process.env` reads in core/provider defaults with global-compatible env resolution:
    `globalThis.__K_MSG_ENV__` -> `globalThis.__ENV__` -> `globalThis.process?.env`.
  - Removed `@types/node` from package-level devDependencies where no longer needed. — Thanks @imjlk!
- Updated dependencies: core@0.17.0, messaging@0.17.0

## 0.16.0 — 2026-02-17

### Patch changes

- Updated dependencies: messaging@0.16.0

## 0.15.0 — 2026-02-17

### Patch changes

- Updated dependencies: messaging@0.15.0

## 0.14.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: messaging@0.14.0

## 0.13.0 — 2026-02-16

### Patch changes

- [d6440b8](https://github.com/k-otp/k-msg/commit/d6440b88137510a696cbbbe407f90b9828795599) Restructure messaging APIs into dedicated subpaths and keep the root export send-focused.
  
  - Move delivery-tracking APIs to `@k-msg/messaging/tracking`.
  - Move bulk sender to `@k-msg/messaging/sender`.
  - Move queue contracts to `@k-msg/messaging/queue` and expose `JobStatus` there.
  - Remove these symbols from `@k-msg/messaging` root.
  - Update `k-msg` and analytics internals to consume the new subpaths. — Thanks @imjlk!
- Updated dependencies: messaging@0.13.0

## 0.12.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.12.0

## 0.11.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.10.1

## 0.10.0 — 2026-02-16

### Patch changes

- Updated dependencies: messaging@0.10.0

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: messaging@0.9.0

## 0.8.0 — 2026-02-15

### Minor changes

- [02d8e88](https://github.com/k-otp/k-msg/commit/02d8e885003795c3a198053514d6598e657ba855) Replace the legacy CLI with a Bunli-based CLI and add Kakao Channel/Template
  management commands. Extend core/provider template APIs (TemplateProvider ctx,
  KakaoChannelProvider, TemplateInspectionProvider) and implement capabilities in
  IWINV/Aligo providers. — Thanks @imjlk!

### Patch changes

- Updated dependencies: messaging@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

- [e9825cf](https://github.com/k-otp/k-msg/commit/e9825cfa0bfdf8c4ec2745c0fa42f46dd4b59a7e) Add query-based delivery tracking analytics.
  
  - `@k-msg/messaging`: extend `DeliveryTrackingStore` with optional query/count APIs and persist provider status/timestamps for reporting.
  - `@k-msg/analytics`: add `DeliveryTrackingAnalyticsService` that computes KPIs/breakdowns by querying a `DeliveryTrackingStore` (SQLite/Bun.SQL/memory). — Thanks @imjlk!
- Updated dependencies: messaging@0.7.3

## 0.7.2 — 2026-02-15

### Patch changes

- Updated dependencies: messaging@0.7.2

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!
- Updated dependencies: messaging@0.7.1

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

### Patch changes

- Updated dependencies: messaging@0.7.0

## 0.6.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.6.0

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

### Patch changes

- Updated dependencies: messaging@0.5.0

## 0.4.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.4.0

## 0.3.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.3.0

## 0.2.0 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

- Updated dependencies: messaging@0.1.6

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!
- Updated dependencies: messaging@0.1.5

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!
- Updated dependencies: messaging@0.1.4

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!
- Updated dependencies: messaging@0.1.3

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
- Updated dependencies: messaging@0.1.2

