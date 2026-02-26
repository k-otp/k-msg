# @k-msg/webhook

## 0.26.0 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.26.0

## 0.25.1 — 2026-02-26

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.25.1

## 0.25.0 — 2026-02-25

### Patch changes

- Updated dependencies: core@0.25.0

## 0.24.1 — 2026-02-23

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.24.1

## 0.24.0 — 2026-02-22

### Minor changes

- [d9b33e9](https://github.com/k-otp/k-msg/commit/d9b33e9b4202ab6854cb380b89b84dbf1dec1fba) Add P1/P2 wave-3 crypto hardening and operations features:
  
  - `@k-msg/core`
    - extend crypto metric/control signal types with circuit-state event model
  
  - `@k-msg/messaging`
    - add `CryptoCircuitController` and control-signal configuration for delivery tracking crypto
    - emit circuit-state metrics (`crypto_circuit_state`, `crypto_circuit_open_count`) on encrypt/decrypt paths
    - add regression tests for scope-level circuit behavior
  
  - `@k-msg/webhook`
    - apply `fieldCrypto` to runtime persistence paths (in-memory and D1 via store wrapper)
    - enforce runtime config validation for webhook `fieldCrypto` policies
    - remove legacy registry storage options `enableEncryption` / `encryptionKey`
  
  Also update CI/docs operations:
  
  - add docs-check retry script and CI workflow improvements for flaky canceled/timeout behavior
  - add dedicated crypto regression CI job
  - expand security docs (ko/en + root docs) and CLI migration docs — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.24.0

## 0.23.1 — 2026-02-22

### Patch changes

- [df9c3d7](https://github.com/k-otp/k-msg/commit/df9c3d78d3aa560412207d6021b564ec52e0602a) Harden field crypto P0 policy and improve beginner-facing security docs.
  
  - add fail-fast `fieldCrypto` policy validation API (`validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`)
  - enforce secure-mode config checks at tracking store initialization
  - strengthen fail-open metric tags and normalization consistency for hash lookups
  - apply the same validation policy to webhook registry crypto options
  - add plain-language security glossary/recipes in docs (ko/en) and root basics docs — Thanks @imjlk!
- Updated dependencies: core@0.23.1

## 0.23.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.23.0

## 0.22.3 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.3

## 0.22.2 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.22.2

## 0.22.1 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.1

## 0.22.0 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.22.0

## 0.21.1 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.21.1

## 0.21.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.21.0

## 0.20.0 — 2026-02-21

### Minor changes

- [d9be998](https://github.com/k-otp/k-msg/commit/d9be9982d84ff67e5887775a0b1fbe19e889f826) Rewrite `@k-msg/webhook` around a runtime-first DX flow and add Cloudflare D1 persistence adapters.
  
  > Note: This release includes intentional breaking changes but is versioned as `minor` by repository policy.
  
  ## Highlights
  
  - root exports are now runtime-focused (`WebhookRuntimeService`, in-memory persistence helpers)
  - advanced classes moved to `@k-msg/webhook/toolkit`
  - new Cloudflare adapter subpath: `@k-msg/webhook/adapters/cloudflare`
    - `createD1WebhookPersistence`
    - `buildWebhookSchemaSql`
    - `initializeWebhookSchema`
  - endpoint registration no longer auto-sends probe webhooks
  - metadata filter matching now fail-close when required keys are missing
  - private-host URL policy defaults to deny unless explicitly allowed
  
  ## Migration
  
  - replace root `WebhookService` usage with `WebhookRuntimeService`
  - import advanced classes from `@k-msg/webhook/toolkit`
  - call `probeEndpoint()` explicitly when you need endpoint probe checks — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.20.0

## 0.19.1 — 2026-02-21

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.19.1

## 0.19.0 — 2026-02-19

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.19.0

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.2

## 0.18.1 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.18.1

## 0.18.0 — 2026-02-17

### Patch changes

- Updated dependencies: core@0.18.0

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

- [408608b](https://github.com/k-otp/k-msg/commit/408608bca6cb859f94e25ef02b1abe7c6009d3d5) Remove runtime dependence on Node built-ins in `@k-msg/webhook` so it can run in Edge environments without `nodejs_compat`.
  `events`, `node:crypto`, `fs/path`, `NodeJS.Timeout`, and direct `process.env` usage are replaced with runtime-neutral implementations.
  File persistence is now adapter-based via `fileAdapter`, and README docs include a Node compatibility adapter example. — Thanks @imjlk!
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

### Patch changes

- Updated dependencies: messaging@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

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

