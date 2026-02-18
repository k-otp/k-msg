# @k-msg/channel

## 0.18.2 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy

## 0.18.1 — 2026-02-18

### Patch changes

- Bumped due to fixed dependency group policy

## 0.18.0 — 2026-02-17

### Minor changes

- Bumped due to fixed dependency group policy

## 0.17.0 — 2026-02-17

### Patch changes

- [bd3629c](https://github.com/k-otp/k-msg/commit/bd3629c464322350ba6f7cb6699de5f83e659cb3) Remove runtime dependence on Node's `events` module in `@k-msg/channel` so it can run in Edge environments without `nodejs_compat`.
  Also drops `@types/node` from the package's dev dependencies and documents Edge runtime compatibility in package README files. — Thanks @imjlk!

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

- Bumped due to fixed dependency group policy

## 0.11.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

## 0.10.1 — 2026-02-16

### Patch changes

- Bumped due to fixed dependency group policy

## 0.10.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

## 0.9.0 — 2026-02-16

### Minor changes

- Bumped due to fixed dependency group policy

## 0.8.0 — 2026-02-15

### Minor changes

- Bumped due to fixed dependency group policy

## 0.7.3 — 2026-02-15

### Patch changes

- Bumped due to fixed dependency group policy

## 0.7.2 — 2026-02-15

### Patch changes

- [39d52c9](https://github.com/k-otp/k-msg/commit/39d52c91f036d5c9fbcd4abf83f4aa5f26af6552) Fix template button (de)serialization for iOS/Android links, preserve Dates when cloning TemplateBuilder, and harden channel number verification (normalization + attempt tracking). — Thanks @imjlk!

## 0.7.1 — 2026-02-15

### Patch changes

- [41c5f8d](https://github.com/k-otp/k-msg/commit/41c5f8dda1770d6d7213de8a99ef2eb693fbf50c) Fix delivery tracking for scheduled messages and preserve IWINV "pending" statuses during polling. — Thanks @imjlk!

## 0.7.0 — 2026-02-15

### Minor changes

- [8531a52](https://github.com/k-otp/k-msg/commit/8531a525c925995ca8ec2d2813e55c526e8e6196) Add delivery status tracking via provider polling (PULL), with pluggable stores (memory / SQLite / Bun.SQL) and provider delivery-status query capability. — Thanks @imjlk!

## 0.6.0 — 2026-02-14

### Minor changes

- Bumped due to fixed dependency group policy

## 0.5.0 — 2026-02-14

### Minor changes

- [e9e79d8](https://github.com/k-otp/k-msg/commit/e9e79d84c1cbeb34c60f6f395d8e1740d7c8ccaa) Unify the public API around `new KMsg({ providers })` + `send({ type, ... })`.
  
  - Remove legacy Platform/UniversalProvider/StandardRequest public APIs
  - Rename `templateId` -> `templateCode`, and message discriminant to `type`
  - Refactor built-in providers to the unified `SendOptions + Result` interface — Thanks @imjlk!

## 0.4.0 — 2026-02-14

### Minor changes

- Bumped due to fixed dependency group policy

## 0.3.0 — 2026-02-14

### Minor changes

- Bumped due to fixed dependency group policy

## 0.2.0 — 2026-02-14

### Minor changes

- Bumped due to fixed dependency group policy

## 0.1.6 — 2026-02-14

### Patch changes

- Bumped due to fixed dependency group policy

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

