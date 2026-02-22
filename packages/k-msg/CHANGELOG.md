# k-msg

## 0.21.0 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.21.0, messaging@0.21.0

## 0.20.0 — 2026-02-21

### Patch changes

- Updated dependencies: core@0.20.0, messaging@0.20.0

## 0.19.1 — 2026-02-21

### Patch changes

- Updated dependencies: core@0.19.1, messaging@0.19.1

## 0.19.0 — 2026-02-19

### Patch changes

- Updated dependencies: core@0.19.0, messaging@0.19.0

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.2, messaging@0.18.2

## 0.18.1 — 2026-02-18

### Patch changes

- Updated dependencies: core@0.18.1, messaging@0.18.1

## 0.18.0 — 2026-02-17

### Minor changes

- [373c0d3](https://github.com/k-otp/k-msg/commit/373c0d3b24986159045ddee065a05bfda1935cd3) Unify `KMsg.send` for single and batch inputs with built-in chunking, add configurable persistence strategies (`none`, `log`, `queue`, `full`) via a new message repository contract, and migrate bulk sending internals off `sendMany` to the unified `send` API. — Thanks @imjlk!

### Patch changes

- [0ab7671](https://github.com/k-otp/k-msg/commit/0ab76719102c849ac0b024e7aac4277e92014ead) Expose selected core utilities from `k-msg` root (`KMsgError`, `KMsgErrorCode`, `ok`, `fail`, and key send-related types) to reduce onboarding friction while keeping provider and tracking APIs out of the root facade.
  
  Also updates root export boundary tests to match the new facade contract. — Thanks @imjlk!
- [8d554ce](https://github.com/k-otp/k-msg/commit/8d554cee95b69570a3d87325331138a59f5a6170) Align `k-msg` packaging metadata with the current workspace release line by refreshing the lockfile, so packed dependencies resolve to the current `@k-msg/*` versions instead of stale `0.16.0`.
  
  Also updates facade docs/tests to match the current root export contract (`KMsgErrorCode` and `fail` checks included). — Thanks @imjlk!
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
- [6f864c5](https://github.com/k-otp/k-msg/commit/6f864c5d8c8555dec0396b291d2489036136ad54) Harden package release operations by syncing the Bun lockfile after version bumps and standardizing workspace type dependency pins.
  Also separates dependency review workflows for core packages/apps vs examples. — Thanks @imjlk!
- Updated dependencies: messaging@0.17.0

## 0.16.0 — 2026-02-17

### Patch changes

- Updated dependencies: messaging@0.16.0

## 0.15.0 — 2026-02-17

### Patch changes

- [4c44fd6](https://github.com/k-otp/k-msg/commit/4c44fd69c33fc8c6a5ac64da136daeb37daf89ff) Split SOLAPI exports into `@k-msg/provider/solapi` and make `solapi` an optional peer dependency,
  while keeping runtime-neutral exports on `@k-msg/provider`.
  
  Also updated messaging cloudflare DO storage typing compatibility and refreshed docs/examples
  (including advanced Pages routes and new Bun/Express Node send-only templates). — Thanks @imjlk!
- Updated dependencies: messaging@0.15.0

## 0.14.0 — 2026-02-16

### Minor changes

- [d5aa989](https://github.com/k-otp/k-msg/commit/d5aa9890a458226417ab95826ffad8d849c8b1e4) Refocus the `k-msg` root facade on the basic send flow.
  
  - Keep only `KMsg` exported from `k-msg`.
  - Remove root re-exports of provider constructors, tracking APIs, and core utilities.
  - Update docs and internal workspace usage to import advanced APIs from package-specific entry points such as `@k-msg/provider` and `@k-msg/messaging/*`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: messaging@0.14.0

## 0.13.0 — 2026-02-16

### Minor changes

- [d6440b8](https://github.com/k-otp/k-msg/commit/d6440b88137510a696cbbbe407f90b9828795599) Restructure messaging APIs into dedicated subpaths and keep the root export send-focused.
  
  - Move delivery-tracking APIs to `@k-msg/messaging/tracking`.
  - Move bulk sender to `@k-msg/messaging/sender`.
  - Move queue contracts to `@k-msg/messaging/queue` and expose `JobStatus` there.
  - Remove these symbols from `@k-msg/messaging` root.
  - Update `k-msg` and analytics internals to consume the new subpaths. — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.13.0, channel@0.13.0, core@0.13.0, messaging@0.13.0, provider@0.13.0, template@0.13.0, webhook@0.13.0

## 0.12.0 — 2026-02-16

### Minor changes

- [191c4ea](https://github.com/k-otp/k-msg/commit/191c4ea6e037baa7469e0ef7ffe1af8040e2a047) Split runtime-specific messaging implementations into adapter subpaths and keep root APIs runtime-neutral.
  
  - Remove `test-utils` from `@k-msg/core` public exports.
  - Enforce `IWINVProvider` MMS image input as `blob/bytes` only and drop Node-only file/path/buffer dependencies.
  - Add `@k-msg/messaging/adapters/{bun,node,cloudflare}` with Cloudflare support for Hyperdrive/Postgres/MySQL/D1 and KV/R2/DO-backed object adapters.
  - Sync `k-msg/adapters/{bun,node,cloudflare}` re-exports and package export maps. — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.12.0, channel@0.12.0, core@0.12.0, messaging@0.12.0, provider@0.12.0, template@0.12.0, webhook@0.12.0

## 0.11.0 — 2026-02-16

### Breaking changes

- Runtime-coupled messaging symbols were removed from `k-msg` root export.
- Runtime-specific adapters are now exposed via:
  - `k-msg/adapters/bun`
  - `k-msg/adapters/node`
  - `k-msg/adapters/cloudflare`

### Patch changes

- Updated dependencies: analytics@0.11.0, channel@0.11.0, core@0.11.0, messaging@0.11.0, provider@0.11.0, template@0.11.0, webhook@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- Updated dependencies: analytics@0.10.1, channel@0.10.1, core@0.10.1, messaging@0.10.1, provider@0.10.1, template@0.10.1, webhook@0.10.1

## 0.10.0 — 2026-02-16

### Minor changes

- [09fb135](https://github.com/k-otp/k-msg/commit/09fb135888bb5d764f5dc37f8b3555b30db25d09) Formalize provider onboarding specs and add CLI doctor/preflight flow for AlimTalk readiness checks.
  
  Introduce provider onboarding registry metadata, plusId policy enforcement for ALIMTALK send, and opt-in provider live integration workflow scaffolding.
  
  Lock IWINV endpoint handling to built-in defaults (no base URL env/config overrides) and remove those fields from CLI/provider examples and docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.10.0, channel@0.10.0, core@0.10.0, messaging@0.10.0, provider@0.10.0, template@0.10.0, webhook@0.10.0

## 0.9.0 — 2026-02-16

### Minor changes

- [e313781](https://github.com/k-otp/k-msg/commit/e313781eb869fb3f8baf83c376e38ba359cd61d1) Formalize ALIMTALK `failover` options and expose provider warning metadata.
  
  - Add standardized failover fields (`enabled`, `fallbackChannel`, `fallbackContent`, `fallbackTitle`) and `warnings` in send results.
  - Add provider failover mapping/warnings for `iwinv`, `solapi`, `aligo`, and `mock`.
  - Add delivery-tracking-based API-level SMS/LMS fallback for non-Kakao-user ALIMTALK failures (single attempt).
  - Add CLI failover flags and warning output to make behavior consistent across providers. — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.9.0, channel@0.9.0, core@0.9.0, messaging@0.9.0, provider@0.9.0, template@0.9.0, webhook@0.9.0

## 0.8.0 — 2026-02-15

### Minor changes

- [02d8e88](https://github.com/k-otp/k-msg/commit/02d8e885003795c3a198053514d6598e657ba855) Replace the legacy CLI with a Bunli-based CLI and add Kakao Channel/Template
  management commands. Extend core/provider template APIs (TemplateProvider ctx,
  KakaoChannelProvider, TemplateInspectionProvider) and implement capabilities in
  IWINV/Aligo providers. — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.8.0, channel@0.8.0, core@0.8.0, messaging@0.8.0, provider@0.8.0, template@0.8.0, webhook@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

- Updated dependencies: analytics@0.7.3, channel@0.7.3, core@0.7.3, messaging@0.7.3, provider@0.7.3, template@0.7.3, webhook@0.7.3

## 0.7.2 — 2026-02-15

### Patch changes

- Updated dependencies: analytics@0.7.2, channel@0.7.2, core@0.7.2, messaging@0.7.2, provider@0.7.2, template@0.7.2, webhook@0.7.2

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!
- Updated dependencies: analytics@0.7.1, channel@0.7.1, core@0.7.1, messaging@0.7.1, provider@0.7.1, template@0.7.1, webhook@0.7.1

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.7.0, channel@0.7.0, core@0.7.0, messaging@0.7.0, provider@0.7.0, template@0.7.0, webhook@0.7.0

## 0.6.0 — 2026-02-14

### Minor changes

- [9a977dd](https://github.com/k-otp/k-msg/commit/9a977ddcebd5cf5fb1d20aaddec9d4cfae03650e) Add extensible `media.image` binary inputs to core send options and implement MMS support:
  - IWINV MMS v2 via multipart/form-data with `secret` header
  - SOLAPI accepts `media.image.ref` as an alias for `imageUrl` (MMS/FriendTalk/RCS_MMS) — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.6.0, channel@0.6.0, core@0.6.0, messaging@0.6.0, provider@0.6.0, template@0.6.0, webhook@0.6.0

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

### Patch changes

- Updated dependencies: analytics@0.5.0, channel@0.5.0, core@0.5.0, messaging@0.5.0, provider@0.5.0, template@0.5.0, webhook@0.5.0

## 0.4.0 — 2026-02-14

### Patch changes

- Updated dependencies: analytics@0.4.0, channel@0.4.0, core@0.4.0, messaging@0.4.0, provider@0.4.0, template@0.4.0, webhook@0.4.0

## 0.3.0 — 2026-02-14

### Patch changes

- Updated dependencies: analytics@0.3.0, channel@0.3.0, core@0.3.0, messaging@0.3.0, provider@0.3.0, template@0.3.0, webhook@0.3.0

## 0.2.0 — 2026-02-14

### Patch changes

- Updated dependencies: analytics@0.2.0, channel@0.2.0, core@0.2.0, messaging@0.2.0, provider@0.2.0, template@0.2.0, webhook@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

- Updated dependencies: analytics@0.1.6, channel@0.1.6, core@0.1.6, messaging@0.1.6, provider@0.1.6, template@0.1.6, webhook@0.1.6

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!
- Updated dependencies: analytics@0.1.5, channel@0.1.5, core@0.1.5, messaging@0.1.5, provider@0.1.5, template@0.1.5, webhook@0.1.5

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!
- Updated dependencies: analytics@0.1.4, channel@0.1.4, core@0.1.4, messaging@0.1.4, provider@0.1.4, template@0.1.4, webhook@0.1.4

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!
- Updated dependencies: analytics@0.1.3, channel@0.1.3, core@0.1.3, messaging@0.1.3, provider@0.1.3, template@0.1.3, webhook@0.1.3

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
- Updated dependencies: analytics@0.1.2, channel@0.1.2, core@0.1.2, messaging@0.1.2, provider@0.1.2, template@0.1.2, webhook@0.1.2
