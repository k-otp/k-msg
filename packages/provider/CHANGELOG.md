# @k-msg/provider

## 0.33.0 — 2026-09-28

### Patch changes

- Updated dependencies: core@0.33.0, template@0.33.0

## 0.32.0 — 2026-09-27

### Minor changes

- [005b967c](https://github.com/k-otp/k-msg/commit/005b967c23d5a70e82e6c99d98e1e1b2b48515cc) Let `SolapiProvider` observe the request's abort signal, so `kmsg.send(input, { signal: AbortSignal.timeout(ms) })` bounds SOLAPI calls too. The SOLAPI SDK takes no signal, and the provider ignored the one it was given, so a slow SOLAPI request held the caller for as long as it took. `send()` and `getDeliveryStatus()` now check the signal before each SDK call and stop waiting when it aborts, returning `REQUEST_ABORTED`, or `NETWORK_TIMEOUT` for a timeout, as the other providers do; an MMS, FriendTalk image, RCS or fax send aborted during its file upload is not sent. A send request the SDK already made cannot be cancelled, and SOLAPI may still deliver it, so an abort after that point returns `REQUEST_ABORTED` with `details.requestSent: true` even for a timeout, since retrying could deliver the message twice. `transportCapabilities.abortSignal` is now `"supported"`; `injectableFetch` stays `"unsupported"`. — Thanks @imjlk!
- [5101def8](https://github.com/k-otp/k-msg/commit/5101def82fbabc3aec3b5f4aaf0f92f25190240a) Allow an SMS-only `IWINVProvider`. The AlimTalk `apiKey` was required even to send SMS/LMS/MMS, which authenticate with `smsApiKey` and `smsAuthKey`. `IWINVConfig.apiKey` is now optional: a provider needs `apiKey`, or both SMS keys, and lists only the message types its keys can send. Without `apiKey`, AlimTalk sends, AlimTalk history and balance, and the template APIs fail with `INVALID_REQUEST`, and `getBalance()` defaults to the SMS balance.
  
  In the CLI, an `iwinv` entry needs `apiKey`, or both `smsApiKey` and `smsAuthKey` (`Set apiKey, or smsApiKey + smsAuthKey`; `anyOf` in the JSON schema, from the new `providerConfigKeyAlternatives` export), and the `iwinv_config_required` onboarding check runs only in the AlimTalk preflight. Routes seeded by `config provider add` and `config init` follow each entry's credentials, through the new optional `ProviderCliMetadata.routingSeedTypesForConfig`. Those commands fill in `apiKey: "env:IWINV_API_KEY"` by default, so for SMS-only use remove `apiKey` and the entry's `ALIMTALK` route from the config. — Thanks @imjlk!

### Patch changes

- [455e09e1](https://github.com/k-otp/k-msg/commit/455e09e1e32ee2de6c231a250abc49c23065fe73) Stop requiring a Kakao `plusId` for SOLAPI AlimTalk. SOLAPI identifies the channel by pfId (`kakao.profileId` or `config.kakaoPfId`) and never sends a plusId, but its onboarding spec declared `plusIdPolicy: "required_if_no_inference"` with inference unsupported, so `KMsg.send()` rejected every SOLAPI AlimTalk without `kakao.plusId` before calling the provider, and `k-msg alimtalk preflight` failed on it. The spec now declares the plusId optional and the CLI no longer asks for one for SOLAPI. Since SOLAPI has no template API for preflight to probe, `k-msg alimtalk preflight` now checks the pfId instead: `--sender-key`, a Kakao channel alias, or `solapi.config.kakaoPfId`. The setup checklist and READMEs point at the pfId binding. — Thanks @imjlk!
- [0f561824](https://github.com/k-otp/k-msg/commit/0f561824029125721f8a72ef078c236f59f36ea7) Send the IWINV AlimTalk fallback text that was asked for. `failover.fallbackChannel: "lms"` was mapped to IWINV's `resendType: "Y"`, which resends the AlimTalk text and ignores `resendContent`, so `failover.fallbackContent` was never sent, and `"sms"` asked for direct input even without any content. `resendType` now follows the content: `failover.fallbackContent` (or `providerOptions.resendContent`) is sent with `resendType: "N"`, and without it IWINV's default resends the AlimTalk text. IWINV chooses SMS or LMS by the text's length, so `fallbackChannel` has no IWINV field. An explicit `providerOptions.resendType: "N"` without content now fails with `INVALID_REQUEST`. — Thanks @imjlk!
- [b4043a93](https://github.com/k-otp/k-msg/commit/b4043a93f5bf2bb970aa08bee84b976676b05b17) Document that Aligo has no delivery status lookup. `AligoProvider` implements no `getDeliveryStatus()`: Aligo has result lookup APIs but does not publish the result codes they return. `DeliveryTrackingService` therefore keeps tracked Aligo messages at `SENT` until `polling.maxTrackingDurationMs` (24 h by default) marks them `UNKNOWN`, and `polling.unsupportedProviderStrategy: "unknown"` settles them at the first poll. The provider README now lists which providers support delivery status lookup, and the Aligo onboarding spec notes the limitation. — Thanks @imjlk!
- [67225707](https://github.com/k-otp/k-msg/commit/672257078fc53d70157ad7fa86c7b4eb3abba94f) Stop SOLAPI AlimTalk sends from getting a second fallback message. With `failover.enabled` and a sender number (`from` or `defaultFrom`), SOLAPI replaces a failed AlimTalk with SMS/LMS itself (`kakaoOptions.disableSms: false`), but the send also carried a `FAILOVER_PARTIAL_PROVIDER` warning, which makes `DeliveryTrackingService` with `apiFailover` resend the fallback once the AlimTalk is tracked as failed for a non-Kakao user, so the customer could get it twice. SOLAPI now returns the warning only when the AlimTalk has no sender number, the one case where SOLAPI cannot send the fallback. The messaging README's tracking-based failover example leaves SOLAPI without a sender for this reason. — Thanks @imjlk!
- [4fa441fa](https://github.com/k-otp/k-msg/commit/4fa441fa53cff64c29cc966f99614553930bdc72) Let onboarding checks name the message types they prepare for. `ProviderOnboardingCheckSpec.messageTypes` is a new optional field, and `k-msg providers doctor` skips a check that names only types the provider cannot send, reporting it as not applicable. The IWINV Kakao channel, template capability and template list checks declare `["ALIMTALK"]`, so an SMS-only IWINV configuration no longer fails `doctor` on the Kakao channel prerequisite. `k-msg alimtalk preflight` still evaluates every AlimTalk check. — Thanks @imjlk!
- [09fadd3a](https://github.com/k-otp/k-msg/commit/09fadd3a61209469ab7034c29bd84ffa95ca79eb) Fill IWINV AlimTalk template variables by name. IWINV's `templateParam` is positional, and `IWINVProvider` built it from the order of the `variables` object's keys, so `{ code, name }` for a template that reads `#{name} ... #{code}` swapped the two values. The provider now reads the template text (from `providerOptions.templateContent`, or IWINV's template list API through the send's request context, kept for 10 minutes per provider instance) and sends one value per distinct `#{name}`, in the order the names first appear in the content and then in its button links: the same array the key-order mapping sent when the keys were in template order. A placeholder without a value (no key, or `undefined`) fails the send with `INVALID_REQUEST` before anything is sent; with empty `variables` and no `templateContent`, no lookup is made and IWINV refuses a template that needs values. `providerOptions.templateParam` is still sent as-is. — Thanks @imjlk!
- [fc248a1d](https://github.com/k-otp/k-msg/commit/fc248a1d577cda6c66dc72769fd201b82c8a3e45) Send Aligo AlimTalk messages that match their template. Aligo's `message_1` must be the approved template's text with its variables filled in, but without the undocumented `providerOptions.templateContent` the provider sent the variable values joined by newlines (and an empty message for a template without variables), which Kakao rejects as not matching the template. `AligoProvider` now reads the template body from `providerOptions.templateContent`, or else Aligo's template list API through the send's request context, keeping it for 10 minutes per provider instance and sender key, and fills the placeholders by name. A placeholder without a value in `variables` (no key, or `undefined`) fails the send with `INVALID_REQUEST` before anything is sent; a `_full_text` variable is still sent as-is. — Thanks @imjlk!
- Updated dependencies: core@0.32.0, template@0.32.0

## 0.31.0 — 2026-09-26

### Minor changes

- [50b28c62](https://github.com/k-otp/k-msg/commit/50b28c6279d6f0d195e6f919d499add8861642f9) `MockProvider` takes an optional `id` (`new MockProvider({ id: "mock-sms" })`), which `KMsg` routes by and which results and errors report, so two mocks can stand in for different providers, for example to try `routing.byType` without credentials. The id defaults to `"mock"`, an empty id throws, and `getOnboardingSpec()` returns the mock spec whatever the id. — Thanks @imjlk!
- [7d016cc2](https://github.com/k-otp/k-msg/commit/7d016cc2cb191a5e956218e1477f550f6cdf9f35) `MockProvider` implements `getDeliveryStatus`: every message it sent reports `DELIVERED` until `setDeliveryStatus(providerMessageId, status, details)` changes it, and an unknown id reports not found. Delivery tracking, examples, and tests can now run end to end without real provider credentials. — Thanks @imjlk!

### Patch changes

- [ea626822](https://github.com/k-otp/k-msg/commit/ea626822ed249cadb86397df6434b9e1962bc587) Fix `require()` in Node. The CommonJS build shipped as `.js` files in `"type": "module"` packages, so Node loaded it as ESM and `require()` threw `ReferenceError: module is not defined in ES module scope`. The CommonJS build now ships as `.cjs`, and `main` and every `require` export condition point at it. `require()` and `import()` expose the same export names; `import` still resolves to the `.mjs` build. — Thanks @imjlk!
- [40244ce1](https://github.com/k-otp/k-msg/commit/40244ce13221b9030bbe2d00fc11197e6925e455) Send and read IWINV and Aligo times in Korea Standard Time regardless of the host timezone. Reservation times, history query ranges, and response timestamps were formatted and parsed in the host's local zone. On a UTC host such as Cloudflare Workers or most containers, a message scheduled for 10:00 in Seoul was reserved for 01:00, and delivery and template timestamps came back nine hours off. — Thanks @imjlk!
- [5111c0e6](https://github.com/k-otp/k-msg/commit/5111c0e665c7e6e5ee7a390b050f6c1fbb71d758) Read Aligo AlimTalk and FriendTalk results from the documented `code` and `info.mid` fields, accept the numeric SMS `result_code`, and fix Solapi phone-number normalization and failed delivery-status mapping. — Thanks @imjlk!
- Updated dependencies: core@0.31.0, template@0.31.0

## 0.30.0 — 2026-07-21

### Minor changes

- [15b4244](https://github.com/k-otp/k-msg/commit/15b4244ff73df50d53573c086037bdc840adff00) Add provider-neutral request contexts, injectable fetch support, and explicit transport capabilities so built-in providers can propagate AbortSignal through send and delivery-status requests. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.30.0, template@0.30.0

## 0.29.9 — 2026-07-20

### Patch changes

- [a07e08a](https://github.com/k-otp/k-msg/commit/a07e08aa4b39c2c610fd3895062fdd612cf80513) Restore valid ESM entrypoints in published packages and reject malformed or missing export artifacts before release. — Thanks @imjlk!
- Updated dependencies: core@0.29.9, template@0.29.9

## 0.29.8 — 2026-07-10

### Patch changes

- Updated dependencies: core@0.29.8, template@0.29.8

## 0.29.7 — 2026-06-29

### Patch changes

- [45882cc](https://github.com/k-otp/k-msg/commit/45882cc6a49b333cfc577baab033ab936c5dc254) Broaden SOLAPI peer compatibility to cover the v6 SDK line, prefer the newer `send()` path when available while keeping v5 `sendOne()` compatibility, and refresh install guidance to recommend the latest `solapi` package. — Thanks @imjlk!
- Updated dependencies: core@0.29.7, template@0.29.7

## 0.29.6 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.6, template@0.29.6

## 0.29.5 — 2026-04-12

### Patch changes

- Updated dependencies: core@0.29.5, template@0.29.5

## 0.29.4 — 2026-03-08

### Patch changes

- [91b7e11](https://github.com/k-otp/k-msg/commit/91b7e112852282ef762b234b08adea9a5b41fe91) Improve docs navigation by turning the package and example hub pages into task-oriented decision guides with quick-pick tables and recommended reading paths. — Thanks @imjlk!
- Updated dependencies: core@0.29.4, template@0.29.4

## 0.29.3 — 2026-03-07

### Patch changes

- [94e38e9](https://github.com/k-otp/k-msg/commit/94e38e981d2f6ede91859814125cda54ad1af9a1) Improve docs release safety by failing CI when English docs navigation points to guide pages that do not actually exist. — Thanks @imjlk!
- Updated dependencies: core@0.29.3, template@0.29.3

## 0.29.2 — 2026-03-06

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.2, template@0.29.2

## 0.29.1 — 2026-03-06

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.29.1, template@0.29.1

## 0.29.0 — 2026-03-06

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.29.0, template@0.29.0

## 0.28.0 — 2026-02-28

### Patch changes

- Updated dependencies: core@0.28.0, template@0.28.0

## 0.27.2 — 2026-02-28

### Patch changes

- [0f03230](https://github.com/k-otp/k-msg/commit/0f032306529f3e4b3c8ddc1135123cb901416098) Improve bundle split points for send-focused consumers without breaking existing imports.
  
  - Add provider subpaths for send/template separation:
    - `@k-msg/provider/iwinv/send`
    - `@k-msg/provider/iwinv/template`
    - `@k-msg/provider/aligo/send`
    - `@k-msg/provider/aligo/template`
  - Refactor `@k-msg/messaging/sender` to avoid static `zod` imports on the sender entry path.
  - Add `@k-msg/template/send` and `@k-msg/template/lifecycle` subpaths and mark template package as side-effect free.
  - Strengthen CI bundle checks with raw+gzip limits and forbidden-import guards for send-only artifacts. — Thanks @imjlk!
- Updated dependencies: core@0.27.2, template@0.27.2

## 0.27.1 — 2026-02-27

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.27.1, template@0.27.1

## 0.27.0 — 2026-02-26

### Patch changes

- [a3ac022](https://github.com/k-otp/k-msg/commit/a3ac02295a5156287912fd86036d612f1cf5a98c) optimize bundling boundaries and add lightweight core subpath
  
  - mark core/messaging/provider/k-msg as side-effect-free for better tree shaking
  - externalize workspace/runtime deps during package builds to reduce duplicated bundled payload across subpath entries
  - add `k-msg/core` subpath that re-exports `@k-msg/core` without pulling `KMsg` facade into the same entrypoint — Thanks @imjlk!
- Updated dependencies: core@0.27.0, template@0.27.0

## 0.26.0 — 2026-02-26

### Patch changes

- Updated dependencies: core@0.26.0, template@0.26.0

## 0.25.1 — 2026-02-26

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.25.1, template@0.25.1

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

### Patch changes

- Updated dependencies: core@0.25.0, template@0.25.0

## 0.24.1 — 2026-02-23

### Patch changes

- Bumped due to fixed dependency group policy
- Updated dependencies: core@0.24.1, template@0.24.1

## 0.24.0 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.24.0, template@0.24.0

## 0.23.1 — 2026-02-22

### Patch changes

- Updated dependencies: core@0.23.1, template@0.23.1

## 0.23.0 — 2026-02-22

### Minor changes

- Bumped due to fixed dependency group policy

### Patch changes

- Updated dependencies: core@0.23.0, template@0.23.0

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
