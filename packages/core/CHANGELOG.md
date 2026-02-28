# @k-msg/core

## 0.28.0 — 2026-02-28

### Minor changes

- Bumped due to fixed dependency group policy

## 0.27.2 — 2026-02-28

### Patch changes

- Bumped due to fixed dependency group policy

## 0.27.1 — 2026-02-27

### Patch changes

- Bumped due to fixed dependency group policy

## 0.27.0 — 2026-02-26

### Patch changes

- [a3ac022](https://github.com/k-otp/k-msg/commit/a3ac02295a5156287912fd86036d612f1cf5a98c) optimize bundling boundaries and add lightweight core subpath
  
  - mark core/messaging/provider/k-msg as side-effect-free for better tree shaking
  - externalize workspace/runtime deps during package builds to reduce duplicated bundled payload across subpath entries
  - add `k-msg/core` subpath that re-exports `@k-msg/core` without pulling `KMsg` facade into the same entrypoint — Thanks @imjlk!

## 0.26.0 — 2026-02-26

### Minor changes

- [688192d](https://github.com/k-otp/k-msg/commit/688192d53837838d12515222b4015779331324fe) feat(core,messaging,k-msg): add shared policy/normalization utilities with safe defaults and opt-out modes
  
  - core
    - expose canonical message/delivery status constants and guards
    - add terminal/pollable delivery helper utilities
    - add retry policy JSON parsing/validation helpers (`safe`/`compat`)
    - add provider error normalization helper with source trace metadata
  - messaging
    - add queue send-input builder with `safe` and `unsafe_passthrough` validation modes
    - route `MessageJobProcessor` payload transformation through the shared builder
    - align tracking internals with core terminal status helpers
  - k-msg facade
    - re-export new core helpers from the root package (status + policy/normalization APIs) — Thanks @imjlk!

## 0.25.1 — 2026-02-26

### Patch changes

- Bumped due to fixed dependency group policy

## 0.25.0 — 2026-02-25

### Minor changes

- [bbf102d](https://github.com/k-otp/k-msg/commit/bbf102d150ec268500c7f8c6e0d3a922476ede9c) feat(dx): unified Provider imports, KMsg builder pattern, Result extensions, field-level crypto, comprehensive guides
  
  ## Breaking Changes
  - Legacy `Platform` / `UniversalProvider` / `StandardRequest` public APIs removed
  - Message discriminant is `type` (old `channel` naming removed)
  - `templateCode` renamed to `templateId`
  
  ## New Features
  
  ### API Improvements
  - **Unified Provider imports**: All providers now importable from `@k-msg/provider`
  - **KMsg.simple()**: One-liner for single provider setup
  - **KMsg.builder()**: Fluent API for complex configurations
  - **Result extensions**: `tap`, `tapOk`, `tapErr`, `expect` methods
  - **Error localization**: `KMsgError.getLocalizedMessage(locale)`
  
  ### Documentation
  - Getting started tutorial with Mock Provider
  - Message types comparison guide
  - Provider selection guide
  - Troubleshooting guide with FAQ
  - Use case guides (OTP, order notification, marketing)
  - DX v1 migration guide
  - Field crypto section with privacy warnings — Thanks Sisyphus!

## 0.24.1 — 2026-02-23

### Patch changes

- Bumped due to fixed dependency group policy

## 0.24.0 — 2026-02-22

### Minor changes

- [c0490a9](https://github.com/k-otp/k-msg/commit/c0490a9056a9ed5a526383a03700696bab178486) Add P1 key-management abstraction for field crypto:
  
  - add `createEnvKeyResolver`, `createAwsKmsKeyResolver`, `createVaultTransitKeyResolver`
  - add rollout policy helpers (`ActiveKidRolloutPolicy`, deterministic bucket selection)
  - add `createRollingKeyResolver` for active-kid gradual rollout while keeping multi-kid decrypt safety
  - expand tracking decrypt candidate resolution to include ciphertext envelope `kid` — Thanks @imjlk!
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

## 0.23.1 — 2026-02-22

### Patch changes

- [df9c3d7](https://github.com/k-otp/k-msg/commit/df9c3d78d3aa560412207d6021b564ec52e0602a) Harden field crypto P0 policy and improve beginner-facing security docs.
  
  - add fail-fast `fieldCrypto` policy validation API (`validateFieldCryptoConfig`, `assertFieldCryptoConfig`, `resolveFieldMode`)
  - enforce secure-mode config checks at tracking store initialization
  - strengthen fail-open metric tags and normalization consistency for hash lookups
  - apply the same validation policy to webhook registry crypto options
  - add plain-language security glossary/recipes in docs (ko/en) and root basics docs — Thanks @imjlk!

## 0.23.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

## 0.22.3 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy

## 0.22.2 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy

## 0.22.1 — 2026-02-22

### Patch changes

- [22e0212](https://github.com/k-otp/k-msg/commit/22e0212416885027776910b29a692a50a33c3841) Patch CI failures introduced after `0.22.0` by aligning lint/docs-generated artifacts with repository checks.
  
  - Remove explicit `any` usage in core error utilities.
  - Apply Biome formatting/import cleanup for changed source files.
  - Regenerate CLI help/docs artifacts required by `docs:check`. — Thanks @imjlk!

## 0.22.0 — 2026-02-22

### Minor changes

- [aa04c40](https://github.com/k-otp/k-msg/commit/aa04c40b7cc608252168008fb66a78c0020c367a) Improve k-msg integration contracts for status normalization, retry policy centralization, and tracking observability.
  
  - Add safer status normalization so unknown provider states do not get finalized as immediate failures.
  - Expand retry/error utilities with policy-based classification and richer provider metadata propagation.
  - Extend send hook lifecycle for queued/retry-scheduled/final outcomes.
  - Add Cloudflare schema rendering options for delivery tracking index-name overrides.
  - Upgrade mock provider scenarios for deterministic timeout/failure/delay testing. — Thanks @imjlk!

## 0.21.1 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy

## 0.21.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

## 0.20.0 — 2026-02-21

### Minor changes

- Bumped due to fixed dependency group policy

## 0.19.1 — 2026-02-21

### Patch changes

- Bumped due to fixed dependency group policy

## 0.19.0 — 2026-02-19

### Minor changes

- Bumped due to fixed dependency group policy

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy

## 0.18.1 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy

## 0.18.0 — 2026-02-17

### Minor changes

- [373c0d3](https://github.com/k-otp/k-msg/commit/373c0d3b24986159045ddee065a05bfda1935cd3) Unify `KMsg.send` for single and batch inputs with built-in chunking, add configurable persistence strategies (`none`, `log`, `queue`, `full`) via a new message repository contract, and migrate bulk sending internals off `sendMany` to the unified `send` API. — Thanks @imjlk!

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

## 0.16.0 — 2026-02-17

### Minor changes

- Bumped due to fixed dependency group policy

## 0.15.0 — 2026-02-17

### Minor changes

- Bumped due to fixed dependency group policy

## 0.14.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

## 0.13.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

## 0.12.0 — 2026-02-16

### Minor changes

- [191c4ea](https://github.com/k-otp/k-msg/commit/191c4ea6e037baa7469e0ef7ffe1af8040e2a047) Split runtime-specific messaging implementations into adapter subpaths and keep root APIs runtime-neutral.
  
  - Remove `test-utils` from `@k-msg/core` public exports.
  - Enforce `IWINVProvider` MMS image input as `blob/bytes` only and drop Node-only file/path/buffer dependencies.
  - Add `@k-msg/messaging/adapters/{bun,node,cloudflare}` with Cloudflare support for Hyperdrive/Postgres/MySQL/D1 and KV/R2/DO-backed object adapters.
  - Sync `k-msg/adapters/{bun,node,cloudflare}` re-exports and package export maps. — Thanks @imjlk!

## 0.11.0 — 2026-02-16

### Breaking changes

- Remove `test-utils` from the public root API.
  - `export * from "./test-utils"` was removed from `@k-msg/core`.
  - `MockProvider` / `TestAssertions` are no longer importable from `@k-msg/core`.

### Minor changes

- [3cb2106](https://github.com/k-otp/k-msg/commit/3cb210636587f392ef1c7edd9e2a0f6b65a36972) Align IWINV onboarding/default behavior across core/provider/messaging/CLI:
  
  - Make IWINV onboarding config checks require `apiKey` only (no `baseUrl` requirement), while keeping provider-internal default endpoints.
  - Remove `defaults.from` fallback at messaging/CLI runtime so sender resolution is per-message or provider-level config.
  - Treat Kakao channel alias `senderKey` as optional in CLI config and avoid forcing `IWINV_SENDER_KEY` for IWINV flows.
  - Use raw GitHub schema URLs in generated CLI configs and schema metadata, and stop publishing schema files via Pages. — Thanks @imjlk!

## 0.10.1 — 2026-02-16

### Patch changes

- Bumped due to fixed dependency group policy

## 0.10.0 — 2026-02-16

### Minor changes

- [09fb135](https://github.com/k-otp/k-msg/commit/09fb135888bb5d764f5dc37f8b3555b30db25d09) Formalize provider onboarding specs and add CLI doctor/preflight flow for AlimTalk readiness checks.
  
  Introduce provider onboarding registry metadata, plusId policy enforcement for ALIMTALK send, and opt-in provider live integration workflow scaffolding.
  
  Lock IWINV endpoint handling to built-in defaults (no base URL env/config overrides) and remove those fields from CLI/provider examples and docs. — Thanks @imjlk!

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

## 0.8.0 — 2026-02-15

### Minor changes

- [02d8e88](https://github.com/k-otp/k-msg/commit/02d8e885003795c3a198053514d6598e657ba855) Replace the legacy CLI with a Bunli-based CLI and add Kakao Channel/Template
  management commands. Extend core/provider template APIs (TemplateProvider ctx,
  KakaoChannelProvider, TemplateInspectionProvider) and implement capabilities in
  IWINV/Aligo providers. — Thanks @imjlk!

## 0.7.3 — 2026-02-15

### Patch changes

- Bumped due to fixed dependency group policy

## 0.7.2 — 2026-02-15

### Patch changes

- Bumped due to fixed dependency group policy

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

## 0.6.0 — 2026-02-14

### Minor changes

- [9a977dd](https://github.com/k-otp/k-msg/commit/9a977ddcebd5cf5fb1d20aaddec9d4cfae03650e) Add extensible `media.image` binary inputs to core send options and implement MMS support:
  - IWINV MMS v2 via multipart/form-data with `secret` header
  - SOLAPI accepts `media.image.ref` as an alias for `imageUrl` (MMS/FriendTalk/RCS_MMS) — Thanks @imjlk!

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

## 0.4.0 — 2026-02-14

### Minor changes

- [0663171](https://github.com/k-otp/k-msg/commit/0663171f8bc53e09df94508b31853031dbf39b0a) feat(solapi): support NSA/VOICE/FAX + expand RCS options in universal API — Thanks @imjlk!

## 0.3.0 — 2026-02-14

### Minor changes

- [16c63cd](https://github.com/k-otp/k-msg/commit/16c63cddda0b5bc73d8206caaeaaa420db19b95e) feat(solapi): add SOLAPI provider (UniversalProvider + SDK) with RCS-aware history/balance — Thanks @imjlk!

## 0.2.0 — 2026-02-14

### Minor changes

- [0c5bbd6](https://github.com/k-otp/k-msg/commit/0c5bbd697333ad3ab2022fbf21bb382029d38ee1) feat(iwinv): add SMS v2 charge and history queries (secret auth + 90-day guard) — Thanks @imjlk!

## 0.1.6 — 2026-02-14

### Patch changes

- [19e8849](https://github.com/k-otp/k-msg/commit/19e8849e816686eb75cb499fd53f18b5a3c77f9c) fix(iwinv): stable AUTH header + support custom headers; feat(core): round-robin router provider — Thanks @imjlk!

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
