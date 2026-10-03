# @k-msg/analytics

## 0.34.1 — 2026-10-03

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.34.1, messaging@0.34.1

## 0.34.0 — 2026-10-02

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.34.0, messaging@0.34.0

## 0.33.0 — 2026-09-28

### Patch changes

- Updated dependencies: core@0.33.0, messaging@0.33.0

## 0.32.0 — 2026-09-27

### Minor changes

- [3c9cad9d](https://github.com/k-otp/k-msg/commit/3c9cad9ded5f7377365d14b63bdc263cab973d1f) `WebhookCollector` now verifies signatures for real. It compared the signature with a placeholder built from the payload and secret lengths (`sha256=<length>_<length>`), so anyone who could guess those lengths could forge a passing signature, while a real HMAC never passed. It now checks `sha256=<hex>` (the prefix is optional) against the HMAC-SHA256 of the raw request body keyed with `secretKey`, compares the digests in constant time, and matches `signatureHeader` in any case.
  
  Changes while `enableSignatureValidation` is on (the default):
  
  - Pass the body exactly as received as the new `WebhookData.rawBody` (a string, `Uint8Array`, or `ArrayBuffer`). A webhook without it is rejected, because re-serializing the parsed `body` rarely reproduces the signed bytes.
  - The collector parses `body` from the verified `rawBody`, which must be UTF-8 JSON, so only signed data reaches the transformers and the stored webhooks. `body` can now be omitted (it is still required while validation is off), and a value passed alongside is replaced.
  - Set `secretKey` to a non-empty string. The constructor now throws without one; before, the check was skipped and every webhook was accepted. Only `enableSignatureValidation: false` accepts unsigned webhooks: `undefined`, `null`, `0`, or `""` leave the check on.
  
  In every mode, `maxPayloadSize` now also limits `rawBody`'s size in bytes, checked before anything hashes or stores it, and `rawBody` is read once with byte bodies copied, so changing it after calling `receiveWebhook()` has no effect. Any option passed as `undefined` now keeps its default, so an undefined `maxPayloadSize` or `rateLimitPerMinute` no longer removes that limit. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.32.0, messaging@0.32.0

## 0.31.0 — 2026-09-26

### Patch changes

- [5d94352b](https://github.com/k-otp/k-msg/commit/5d94352ba793f4d1c4bb753f88d46e6bf8c6329f) Build the published bundles with Bun 1.4.2 instead of 1.3.9. Bundles that inline `zod/mini` no longer carry zod's unused locale and JSON Schema modules and shrink by 65–93%: for example, the `@k-msg/template` ESM entry drops from 286 KB to 41 KB and `@k-msg/webhook` from 303 KB to 61 KB. Export names are unchanged. — Thanks @imjlk!
- [ea626822](https://github.com/k-otp/k-msg/commit/ea626822ed249cadb86397df6434b9e1962bc587) Fix `require()` in Node. The CommonJS build shipped as `.js` files in `"type": "module"` packages, so Node loaded it as ESM and `require()` threw `ReferenceError: module is not defined in ES module scope`. The CommonJS build now ships as `.cjs`, and `main` and every `require` export condition point at it. `require()` and `import()` expose the same export names; `import` still resolves to the `.mjs` build. — Thanks @imjlk!
- [6572d60f](https://github.com/k-otp/k-msg/commit/6572d60f59dc8449006d1d4527e8045df1ed483a) `MetricAggregator` now logs a failed periodic flush through the `@k-msg/core` logger instead of leaving an unhandled promise rejection, which ends a Node.js process by default. The buffered metrics are kept, so the next interval retries them as before. — Thanks @imjlk!
- Updated dependencies: core@0.31.0, messaging@0.31.0

## 0.30.0 — 2026-07-21

### Patch changes

- Updated dependencies: core@0.30.0, messaging@0.30.0

## 0.29.9 — 2026-07-20

### Patch changes

- Updated dependencies: core@0.29.9, messaging@0.29.9

## 0.29.8 — 2026-07-10

### Patch changes

- [dd68c83](https://github.com/k-otp/k-msg/commit/dd68c83cf05a11b4052a3a50ffed3908798a9bc4) Reduce duplicated runtime type declarations by deriving selected exported types from their Zod schemas while keeping existing public type names stable. — Thanks @imjlk!
- Updated dependencies: core@0.29.8, messaging@0.29.8

## 0.29.7 — 2026-06-29

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.7, messaging@0.29.7

## 0.29.6 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.6, messaging@0.29.6

## 0.29.5 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.5, messaging@0.29.5

## 0.29.4 — 2026-03-08

### Patch changes

- [91b7e11](https://github.com/k-otp/k-msg/commit/91b7e112852282ef762b234b08adea9a5b41fe91) Improve docs navigation by turning the package and example hub pages into task-oriented decision guides with quick-pick tables and recommended reading paths. — Thanks @imjlk!
- Updated dependencies: core@0.29.4, messaging@0.29.4

## 0.29.3 — 2026-03-07

### Patch changes

- [94e38e9](https://github.com/k-otp/k-msg/commit/94e38e981d2f6ede91859814125cda54ad1af9a1) Improve docs release safety by failing CI when English docs navigation points to guide pages that do not actually exist. — Thanks @imjlk!
- Updated dependencies: core@0.29.3, messaging@0.29.3

## 0.29.2 — 2026-03-06

### Patch changes

- Updated dependencies: core@0.29.2, messaging@0.29.2

## 0.29.1 — 2026-03-06

### Patch changes

- Updated dependencies: core@0.29.1, messaging@0.29.1

## 0.29.0 — 2026-03-06

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.29.0, messaging@0.29.0

## 0.28.0 — 2026-02-28

### Minor changes

- [4c11ff5](https://github.com/k-otp/k-msg/commit/4c11ff5ac8859de63952370eb53722275a8987d9) Switch public schemas to zod/mini while preserving parse/safeParse behavior; schema concrete internals now use mini types. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.28.0, messaging@0.28.0

## 0.27.2 — 2026-02-28

### Patch changes

- Updated dependencies: core@0.27.2, messaging@0.27.2

## 0.27.1 — 2026-02-27

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.27.1, messaging@0.27.1

## 0.27.0 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.27.0, messaging@0.27.0

## 0.26.0 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.26.0, messaging@0.26.0

## 0.25.1 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.25.1, messaging@0.25.1

## 0.25.0 — 2026-02-25

### Patch changes

- Updated dependencies: core@0.25.0, messaging@0.25.0

## 0.24.1 — 2026-02-23

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.24.1, messaging@0.24.1

## 0.24.0 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.24.0, messaging@0.24.0

## 0.23.1 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.23.1, messaging@0.23.1

## 0.23.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.23.0, messaging@0.23.0

## 0.22.3 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.3, messaging@0.22.3

## 0.22.2 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.2, messaging@0.22.2

## 0.22.1 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.1, messaging@0.22.1

## 0.22.0 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.0, messaging@0.22.0

## 0.21.1 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.21.1, messaging@0.21.1

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

