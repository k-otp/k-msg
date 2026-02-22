# @k-msg/provider

## 0.22.3 — 2026-02-22

### Patch changes

- Bumped due to fixed dependency group policy
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

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.21.1, template@0.21.1

## 0.21.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.21.0, template@0.21.0

## 0.20.0 — 2026-02-21

### Patch changes

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
- Updated dependencies: core@0.20.0, template@0.20.0

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

- [aafac43](https://github.com/k-otp/k-msg/commit/aafac43c09c7b95a0a50af610662c91cbc4e6c76) Remove duplicated CLI provider config metadata by sourcing labels, routing seed types, and recommended defaults from `@k-msg/provider`. Also update template option wording to `Template ID` and fix root breaking-change notes to `templateCode -> templateId`. — Thanks @imjlk!
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

- [e03af15](https://github.com/k-otp/k-msg/commit/e03af158dbbc50b9dd9c6196afe56885df1a2848) Remove remaining Node runtime dependencies from analytics/messaging/runtime paths and standardize runtime-neutral environment variable access.
  
  - Replaced Node `events` usage with package-local runtime-neutral `EventEmitter` implementations.
  - Replaced `NodeJS.Timeout` annotations with `ReturnType<typeof setTimeout/setInterval>`.
  - Replaced direct `process.env` reads in core/provider defaults with global-compatible env resolution:
    `globalThis.__K_MSG_ENV__` -> `globalThis.__ENV__` -> `globalThis.process?.env`.
  - Removed `@types/node` from package-level devDependencies where no longer needed. — Thanks @imjlk!
- [f0c6664](https://github.com/k-otp/k-msg/commit/f0c66642c360d6d8abb83eeb9cbc3d58bf3dcb7f) Refactor built-in providers (`iwinv`, `solapi`, `aligo`) into facade + domain modules while keeping public APIs unchanged.
  Also adds a reusable shared base64 utility and provider structure guide for consistent future provider splits. — Thanks @imjlk!
- Updated dependencies: core@0.17.0

## 0.16.0 — 2026-02-17

### Minor changes

- [d0b4040](https://github.com/k-otp/k-msg/commit/d0b404088e5aed87c7b7211a0dab6f36bee2de13) Improve package boundaries and runtime safety across provider/messaging/cli:
  
  - Make package builds deterministic by running `clean` before each build pipeline.
  - Remove stale/unused dependencies and TS references in messaging/webhook/provider.
  - Add `@k-msg/provider/aligo` subpath export and keep `@k-msg/provider/solapi` as a dedicated subpath.
  - Externalize `solapi` from provider dist output while keeping it as optional peer dependency.
  - Update CLI provider registry to lazy-load SOLAPI only when configured, with clear install guidance when missing.
  - Remove unsafe `any` casting from CLI provider capability wiring and add registry boundary tests. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.16.0

## 0.15.0 — 2026-02-17

### Minor changes

- [4c44fd6](https://github.com/k-otp/k-msg/commit/4c44fd69c33fc8c6a5ac64da136daeb37daf89ff) Split SOLAPI exports into `@k-msg/provider/solapi` and make `solapi` an optional peer dependency,
  while keeping runtime-neutral exports on `@k-msg/provider`.
  
  Also updated messaging cloudflare DO storage typing compatibility and refreshed docs/examples
  (including advanced Pages routes and new Bun/Express Node send-only templates). — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.15.0

## 0.14.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.14.0

## 0.13.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.13.0

## 0.12.0 — 2026-02-16

### Minor changes

- [191c4ea](https://github.com/k-otp/k-msg/commit/191c4ea6e037baa7469e0ef7ffe1af8040e2a047) Split runtime-specific messaging implementations into adapter subpaths and keep root APIs runtime-neutral.
  
  - Remove `test-utils` from `@k-msg/core` public exports.
  - Enforce `IWINVProvider` MMS image input as `blob/bytes` only and drop Node-only file/path/buffer dependencies.
  - Add `@k-msg/messaging/adapters/{bun,node,cloudflare}` with Cloudflare support for Hyperdrive/Postgres/MySQL/D1 and KV/R2/DO-backed object adapters.
  - Sync `k-msg/adapters/{bun,node,cloudflare}` re-exports and package export maps. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.12.0

## 0.11.0 — 2026-02-16

### Breaking changes

- `IWINVProvider` MMS image input is now `blob/bytes` only.
  - `media.image.ref` and `imageUrl` are rejected with `INVALID_REQUEST`.
  - Local-file/URL image fetch resolution has been removed from provider runtime.
- Remove Node.js runtime dependencies from `IWINVProvider` (`node:buffer`, `node:fs/promises`, `node:path`) for edge/runtime-neutral usage.
- Add provider subpath export for edge-friendly imports: `@k-msg/provider/iwinv`.

### Patch changes

- Updated dependencies: core@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- [f4c6f63](https://github.com/k-otp/k-msg/commit/f4c6f63786ea16381a6cd3e00e2f47d3a9291340) Follow-up patch release to keep CI green after onboarding-spec updates.
  
  This changeset captures the post-merge Biome formatting fix that unblocked CI for the onboarding provider specs tests. — Thanks @imjlk!
- Updated dependencies: core@0.10.1

## 0.10.0 — 2026-02-16

### Minor changes

- [09fb135](https://github.com/k-otp/k-msg/commit/09fb135888bb5d764f5dc37f8b3555b30db25d09) Formalize provider onboarding specs and add CLI doctor/preflight flow for AlimTalk readiness checks.
  
  Introduce provider onboarding registry metadata, plusId policy enforcement for ALIMTALK send, and opt-in provider live integration workflow scaffolding.
  
  Lock IWINV endpoint handling to built-in defaults (no base URL env/config overrides) and remove those fields from CLI/provider examples and docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.10.0

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.9.0

## 0.8.0 — 2026-02-15

### Minor changes

- [02d8e88](https://github.com/k-otp/k-msg/commit/02d8e885003795c3a198053514d6598e657ba855) Replace the legacy CLI with a Bunli-based CLI and add Kakao Channel/Template
  management commands. Extend core/provider template APIs (TemplateProvider ctx,
  KakaoChannelProvider, TemplateInspectionProvider) and implement capabilities in
  IWINV/Aligo providers. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.8.0

## 0.7.3 — 2026-02-15

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.7.3

## 0.7.2 — 2026-02-15

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.7.2

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!
- Updated dependencies: core@0.7.1

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.7.0

## 0.6.0 — 2026-02-14

### Minor changes

- [9a977dd](https://github.com/k-otp/k-msg/commit/9a977ddcebd5cf5fb1d20aaddec9d4cfae03650e) Add extensible `media.image` binary inputs to core send options and implement MMS support:
  - IWINV MMS v2 via multipart/form-data with `secret` header
  - SOLAPI accepts `media.image.ref` as an alias for `imageUrl` (MMS/FriendTalk/RCS_MMS) — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.6.0

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.5.0

## 0.4.0 — 2026-02-14

### Minor changes

- [0663171](https://github.com/k-otp/k-msg/commit/0663171f8bc53e09df94508b31853031dbf39b0a) feat(solapi): support NSA/VOICE/FAX + expand RCS options in universal API — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.4.0

## 0.3.0 — 2026-02-14

### Minor changes

- [16c63cd](https://github.com/k-otp/k-msg/commit/16c63cddda0b5bc73d8206caaeaaa420db19b95e) feat(solapi): add SOLAPI provider (UniversalProvider + SDK) with RCS-aware history/balance — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.3.0

## 0.2.0 — 2026-02-14

### Minor changes

- [0c5bbd6](https://github.com/k-otp/k-msg/commit/0c5bbd697333ad3ab2022fbf21bb382029d38ee1) feat(iwinv): add SMS v2 charge and history queries (secret auth + 90-day guard) — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

- [19e8849](https://github.com/k-otp/k-msg/commit/19e8849e816686eb75cb499fd53f18b5a3c77f9c) fix(iwinv): stable AUTH header + support custom headers; feat(core): round-robin router provider — Thanks @imjlk!
- Updated dependencies: core@0.1.6

## 0.1.5 — 2026-02-14

### Patch changes

- [92fe876](https://github.com/k-otp/k-msg/commit/92fe8769bbb6cb73f392498b71c30a882574a5c5) fix(release): republish to correct workspace dependency versions — Thanks @imjlk!
- Updated dependencies: core@0.1.5

## 0.1.4 — 2026-02-14

### Patch changes

- [82173bf](https://github.com/k-otp/k-msg/commit/82173bff8a4e71fe76ec2913d38a60c3d409ac4e) test(release): verify npm OIDC trusted publishing — Thanks @imjlk!
- Updated dependencies: core@0.1.4

## 0.1.3 — 2026-02-14

### Patch changes

- [f9ff20f](https://github.com/imjlk/k-msg/commit/f9ff20f80e2a950ae85500679445f7e1cc46b8c5) Fix published workspace dependency metadata by keeping bun.lock in sync with release versions. — Thanks @imjlk!
- Updated dependencies: core@0.1.3

## 0.1.2 — 2026-02-14

### Patch changes

- [117d592](https://github.com/imjlk/k-msg/commit/117d59224e655dde1a599e8f694e421a12474a42) Bootstrap Sampo-driven release PR automation and Bun-based CI/CD. — Thanks @imjlk!
- Updated dependencies: core@0.1.2
