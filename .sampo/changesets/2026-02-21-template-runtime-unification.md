---
npm/@k-msg/template: major
npm/@k-msg/messaging: major
npm/@k-msg/cli: major
npm/@k-msg/provider: patch
---

Refactor template handling around `@k-msg/template` as the single runtime source of truth.

## `@k-msg/template` (major)

- introduce runtime-first API surface:
  - `TemplateLifecycleService`
  - `TemplatePersonalizer`, `defaultTemplatePersonalizer`, `TemplateVariableUtils`
  - `validateTemplatePayload`, `parseTemplateButtons`
- split builder/registry/testing helpers to a dedicated subpath: `@k-msg/template/toolkit`
- remove legacy root exports that overlapped service semantics (`TemplateService`, `MockTemplateService`, root-level builder/registry exports)
- move personalization implementation from messaging into template package

## `@k-msg/messaging` (major)

- remove root personalization exports:
  - `VariableReplacer`
  - `VariableUtils`
  - `defaultVariableReplacer`
- migration path: import the renamed equivalents from `@k-msg/template`
  - `TemplatePersonalizer`
  - `TemplateVariableUtils`
  - `defaultTemplatePersonalizer`

## `@k-msg/cli` (major)

- route `kakao template *` commands through `TemplateLifecycleService` instead of direct provider template method calls
- apply template runtime validation (`validateTemplatePayload`, `parseTemplateButtons`) before provider requests for create/update flows

## `@k-msg/provider` (patch)

- remove duplicate template interpolation path in Aligo send by reusing template runtime interpolation
- apply shared template payload/button validation to Aligo and IWINV template create/update flows
- normalize Aligo template button serialization through the shared template button parser/serializer
