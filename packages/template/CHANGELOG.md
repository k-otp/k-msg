# @k-msg/template

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

### Patch changes

- [48e3bbb](https://github.com/k-otp/k-msg/commit/48e3bbb2b2a53d42b7c75bafad0ee79e1827bb94) Remove runtime dependence on Node's event module in `@k-msg/template` so it can run in Edge environments without `nodejs_compat`.
  Also drops `@types/node` from the package's dev dependencies and documents Edge runtime compatibility in package README files. — Thanks @imjlk!
- Updated dependencies: core@0.17.0

## 0.16.0 — 2026-02-17

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.16.0

## 0.15.0 — 2026-02-17

### Minor changes

- Bumped due to fixed dependency group policy

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

### Patch changes

- Updated dependencies: core@0.12.0

## 0.11.0 — 2026-02-16

### Patch changes

- Updated dependencies: core@0.11.0

## 0.10.1 — 2026-02-16

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.10.1

## 0.10.0 — 2026-02-16

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

- [39d52c9](https://github.com/k-otp/k-msg/commit/39d52c91f036d5c9fbcd4abf83f4aa5f26af6552) Fix template button (de)serialization for iOS/Android links, preserve Dates when cloning TemplateBuilder, and harden channel number verification (normalization + attempt tracking). — Thanks @imjlk!
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

### Patch changes

- Updated dependencies: core@0.4.0

## 0.3.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.3.0

## 0.2.0 — 2026-02-14

### Patch changes

- Updated dependencies: core@0.2.0

## 0.1.6 — 2026-02-14

### Patch changes

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

