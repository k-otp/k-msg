# @k-msg/core

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
