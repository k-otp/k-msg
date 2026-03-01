# @k-msg/cli

## 0.9.0 — 2026-03-01

### Minor changes

- [ee90600](https://github.com/k-otp/k-msg/commit/ee90600cc60e349544edee57101d5ae88002c7e0) Migrate `@k-msg/cli` to Bunli 0.7.1 and adopt the 0.7 command model.
  
  - Convert command trees to `defineGroup` for Bunli 0.7.x compatibility.
  - Add runtime-safe shell completions via `k-msg completions <bash|zsh|fish|powershell>` and `k-msg complete -- ...`.
  - Replace custom readline/arrow interactive flows with Bunli/Clack prompt APIs.
  - Standardize interactive cancellation (`Ctrl+C`) to exit with code `2`.
  - Add completion validation/smoke checks in CI and CLI distribution workflows. — Thanks @imjlk!

## 0.8.17 — 2026-02-28

### Patch changes

- Updated dependencies: channel@0.28.0, core@0.28.0, messaging@0.28.0, provider@0.28.0, template@0.28.0, k-msg@0.28.0

## 0.8.16 — 2026-02-28

### Patch changes

- Updated dependencies: channel@0.27.2, core@0.27.2, messaging@0.27.2, provider@0.27.2, template@0.27.2, k-msg@0.27.2

## 0.8.15 — 2026-02-27

### Patch changes

- Updated dependencies: channel@0.27.1, core@0.27.1, messaging@0.27.1, provider@0.27.1, template@0.27.1, k-msg@0.27.1

## 0.8.14 — 2026-02-26

### Patch changes

- Updated dependencies: channel@0.27.0, core@0.27.0, messaging@0.27.0, provider@0.27.0, template@0.27.0, k-msg@0.27.0

## 0.8.13 — 2026-02-26

### Patch changes

- Updated dependencies: channel@0.26.0, core@0.26.0, messaging@0.26.0, provider@0.26.0, template@0.26.0, k-msg@0.26.0

## 0.8.12 — 2026-02-26

### Patch changes

- Updated dependencies: channel@0.25.1, core@0.25.1, messaging@0.25.1, provider@0.25.1, template@0.25.1, k-msg@0.25.1

## 0.8.11 — 2026-02-25

### Patch changes

- Updated dependencies: channel@0.25.0, core@0.25.0, messaging@0.25.0, provider@0.25.0, template@0.25.0, k-msg@0.25.0

## 0.8.10 — 2026-02-23

### Patch changes

- Updated dependencies: channel@0.24.1, core@0.24.1, messaging@0.24.1, provider@0.24.1, template@0.24.1, k-msg@0.24.1

## 0.8.9 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.24.0, core@0.24.0, messaging@0.24.0, provider@0.24.0, template@0.24.0, k-msg@0.24.0

## 0.8.8 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.23.1, core@0.23.1, messaging@0.23.1, provider@0.23.1, template@0.23.1, k-msg@0.23.1

## 0.8.7 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.23.0, core@0.23.0, messaging@0.23.0, provider@0.23.0, template@0.23.0, k-msg@0.23.0

## 0.8.6 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.22.3, core@0.22.3, messaging@0.22.3, provider@0.22.3, template@0.22.3, k-msg@0.22.3

## 0.8.5 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.22.2, core@0.22.2, messaging@0.22.2, provider@0.22.2, template@0.22.2, k-msg@0.22.2

## 0.8.4 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.22.1, core@0.22.1, messaging@0.22.1, provider@0.22.1, template@0.22.1, k-msg@0.22.1

## 0.8.3 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.22.0, core@0.22.0, messaging@0.22.0, provider@0.22.0, template@0.22.0, k-msg@0.22.0

## 0.8.2 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.21.1, core@0.21.1, messaging@0.21.1, provider@0.21.1, template@0.21.1, k-msg@0.21.1

## 0.8.1 — 2026-02-22

### Patch changes

- Updated dependencies: channel@0.21.0, core@0.21.0, messaging@0.21.0, provider@0.21.0, template@0.21.0, k-msg@0.21.0

## 0.8.0 — 2026-02-21

### Minor changes

- [46c54c0](https://github.com/k-otp/k-msg/commit/46c54c059f004c34b0acf497a0d06343ff2b7d83) Refactor Kakao channel handling around `@k-msg/channel` runtime services and redesign CLI channel commands.
  
  ## `@k-msg/channel` (minor)
  
  - split exports into runtime-first root API and toolkit-only subpath (`@k-msg/channel/toolkit`)
  - add runtime services:
    - `KakaoChannelCapabilityService`
    - `KakaoChannelBindingResolver`
    - `KakaoChannelLifecycleService`
  - add runtime channel binding/capability types:
    - `KakaoChannelCapabilityMode`
    - `KakaoChannelBinding`
    - `ResolvedKakaoChannelBinding`
    - `KakaoChannelListItem`
  - add provider adapter flow for mode-specific handling (`aligo`, `iwinv`, `solapi`, `mock`)
  
  ## `@k-msg/cli` (minor)
  
  - replace legacy `kakao channel` direct provider flow with channel runtime services
  - add `kakao channel binding` command group:
    - `list`, `resolve`, `set`, `delete`
  - add `kakao channel api` command group:
    - `categories`, `list`, `auth`, `add`
  - remove legacy `kakao channel categories|list|auth|add` behavior and return guided migration errors
  - unify senderKey/plusId resolution with channel binding resolver (including provider config hints such as `solapi.kakaoPfId`) — Thanks @imjlk!
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

- [ce4bba0](https://github.com/k-otp/k-msg/commit/ce4bba07974365c681e29e6da2e007c968c84c74) Harden CLI installer and launcher path sync behavior to reduce unsafe overwrites across mixed install methods.
  
  - `install.sh` now skips replacing active symlink/script launchers (for example package-manager shims) and falls back to `~/.local/bin` unless `K_MSG_CLI_INSTALL_DIR` is explicitly set.
  - The npm/bun launcher sync logic now targets only active command entries and only replaces native executables, avoiding broad PATH scanning and accidental script replacement. — Thanks @imjlk!
- Updated dependencies: channel@0.20.0, core@0.20.0, messaging@0.20.0, provider@0.20.0, template@0.20.0, k-msg@0.20.0

## 0.7.1 — 2026-02-21

### Patch changes

- Updated dependencies: core@0.19.1, messaging@0.19.1, provider@0.19.1, k-msg@0.19.1

## 0.7.0 — 2026-02-19

### Minor changes

- [6a1562f](https://github.com/k-otp/k-msg/commit/6a1562f9e276b16e9125c94e71513b34888a976e) Add Cloudflare SQL schema generation APIs and Drizzle adapter helpers to `@k-msg/messaging`, including reusable SQL/Drizzle schema renderers and improved retry-safe lazy initialization for SQL-backed tracking stores and job queues.
  
  Add `k-msg db schema print` and `k-msg db schema generate` commands to `@k-msg/cli`, using `@k-msg/messaging/adapters/cloudflare` as the single source of truth for generated SQL and Drizzle schema output. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.19.0, messaging@0.19.0, provider@0.19.0, k-msg@0.19.0

## 0.6.2 — 2026-02-19

### Patch changes

- [7797dc8](https://github.com/k-otp/k-msg/commit/7797dc8dacc4024a2b825fe46c6f266e271e822d) - Fix provider balance CLI exit code semantics: return exit code 3 only for provider errors and 4 when capability is unsupported.
  - Update CLI/README docs to use the correct `providers list --config ...` usage and clarify capability-not-supported exit code.
  - Add GitHub repository button to docs home pages (KO/EN). — Thanks @imjlk!

## 0.6.1 — 2026-02-18

### Patch changes

- [19e519f](https://github.com/k-otp/k-msg/commit/19e519f0edcb4f3a00d07f090046f30ac5c5e87b) Harden CLI/core reliability by making option parsing deterministic (`--flag`/`--no-flag` with strict boolean validation), aligning provider error payloads to `details`, and migrating the send contract field to `templateId` (without compatibility aliases) with matching docs/tests and canonical CI parity checks. — Thanks @imjlk!
- [aafac43](https://github.com/k-otp/k-msg/commit/aafac43c09c7b95a0a50af610662c91cbc4e6c76) Remove duplicated CLI provider config metadata by sourcing labels, routing seed types, and recommended defaults from `@k-msg/provider`. Also update template option wording to `Template ID` and fix root breaking-change notes to `templateCode -> templateId`. — Thanks @imjlk!
- Updated dependencies: core@0.18.2, messaging@0.18.2, provider@0.18.2, k-msg@0.18.2

## 0.6.0 — 2026-02-18

### Minor changes

- [a63307e](https://github.com/k-otp/k-msg/commit/a63307eb4a925343b74297b8437f72caba587dff) Improve CLI send usability by clarifying raw-JSON advanced usage, adding `k-msg send --dry-run` preview mode (without provider send), and enhancing batch/error output guidance. — Thanks @imjlk!
- [48f2797](https://github.com/k-otp/k-msg/commit/48f27975b5734c760f5ec99701623865f28d8c8c) Feat: support batch sending via `k-msg send --input '[...]'` and persistence configuration (`strategy`, `repo`) in `k-msg.config.json`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: core@0.18.1, provider@0.18.1, k-msg@0.18.1

## 0.5.8 — 2026-02-17

### Patch changes

- Updated dependencies: core@0.18.0, provider@0.18.0, k-msg@0.18.0

## 0.5.7 — 2026-02-17

### Patch changes

- [7c44cca](https://github.com/k-otp/k-msg/commit/7c44ccaa7eee30d2ecf494c30a388b4a9371fbeb) Avoid double-wrapping SOLAPI dependency load errors in the CLI provider registry.
  The CLI now preserves already-guided dependency errors and keeps the install guidance message single and clear. — Thanks @imjlk!
- Updated dependencies: core@0.17.0, provider@0.17.0, k-msg@0.17.0

## 0.5.6 — 2026-02-17

### Patch changes

- [d0b4040](https://github.com/k-otp/k-msg/commit/d0b404088e5aed87c7b7211a0dab6f36bee2de13) Improve package boundaries and runtime safety across provider/messaging/cli:
  
  - Make package builds deterministic by running `clean` before each build pipeline.
  - Remove stale/unused dependencies and TS references in messaging/webhook/provider.
  - Add `@k-msg/provider/aligo` subpath export and keep `@k-msg/provider/solapi` as a dedicated subpath.
  - Externalize `solapi` from provider dist output while keeping it as optional peer dependency.
  - Update CLI provider registry to lazy-load SOLAPI only when configured, with clear install guidance when missing.
  - Remove unsafe `any` casting from CLI provider capability wiring and add registry boundary tests. — Thanks @imjlk!
- Updated dependencies: core@0.16.0, provider@0.16.0, k-msg@0.16.0

## 0.5.5 — 2026-02-17

### Patch changes

- Updated dependencies: core@0.15.0, provider@0.15.0, k-msg@0.15.0

## 0.5.4 — 2026-02-16

### Patch changes

- Updated dependencies: core@0.14.0, provider@0.14.0, k-msg@0.14.0

## 0.5.3 — 2026-02-16

### Patch changes

- Updated dependencies: k-msg@0.13.0

## 0.5.2 — 2026-02-16

### Patch changes

- Updated dependencies: k-msg@0.12.0

## 0.5.1 — 2026-02-16

### Patch changes

- Updated dependencies: k-msg@0.11.0

## 0.5.0 — 2026-02-16

### Minor changes

- [9f91c30](https://github.com/k-otp/k-msg/commit/9f91c30c7ca372fc9c4caa8ba1d72cdd5eb83cdf) Improve CLI config onboarding and schema distribution:
  
  - Make `k-msg config init` interactive by default, with automatic `--template full` fallback in non-interactive environments.
  - Add `k-msg config provider add [type]` for incremental provider setup via prompts.
  - Switch default config lookup to home-based config directories with legacy `./k-msg.config.json` fallback.
  - Publish `k-msg.config.json` schema files (`latest` and `v1`) to GitHub Pages and include `$schema` in generated configs. — Thanks @imjlk!

## 0.4.1 — 2026-02-16

### Patch changes

- Updated dependencies: k-msg@0.10.1

## 0.4.0 — 2026-02-16

### Minor changes

- [09fb135](https://github.com/k-otp/k-msg/commit/09fb135888bb5d764f5dc37f8b3555b30db25d09) Formalize provider onboarding specs and add CLI doctor/preflight flow for AlimTalk readiness checks.
  
  Introduce provider onboarding registry metadata, plusId policy enforcement for ALIMTALK send, and opt-in provider live integration workflow scaffolding.
  
  Lock IWINV endpoint handling to built-in defaults (no base URL env/config overrides) and remove those fields from CLI/provider examples and docs. — Thanks @imjlk!

### Patch changes

- Updated dependencies: k-msg@0.10.0

## 0.3.4 — 2026-02-16

### Patch changes

- [8b5de1c](https://github.com/k-otp/k-msg/commit/8b5de1ca4e015f2cf1944ea4d067d4c880a53591) Fix global `@k-msg/cli` startup failure when running outside a project that has `bunli.config.*`.
  
  - `createKMsgCli()` now passes explicit CLI metadata (`name`, `version`, `description`) to Bunli.
  - This allows `k-msg` to start correctly even when the current working directory does not contain a Bunli config file.
  - Added an E2E test that runs CLI from a temporary directory without `bunli.config.*`. — Thanks @imjlk!

## 0.3.3 — 2026-02-16

### Patch changes

- Updated dependencies: k-msg@0.9.0

## 0.3.2 — 2026-02-16

### Patch changes

- [4faaeec](https://github.com/k-otp/k-msg/commit/4faaeec2b7e81c20a7695e9d84214cdaf92afa6b) Align the CLI bootstrap with Bunli type-generation by registering commands from
  `apps/cli/.bunli/commands.gen.ts`, and run `bunli generate` before local `test`,
  `dev`, and `build:js` scripts so command registration works reliably in fresh
  environments and CI. — Thanks @imjlk!

## 0.3.1 — 2026-02-16

### Patch changes

- [4aaa986](https://github.com/k-otp/k-msg/commit/4aaa9865c6df4d611e8f64bdd509a500cb9cda42) Narrow AI auto-JSON detection to explicit Codex/MCP runtime env keys to avoid
  switching human CLI output to JSON on unrelated environment variables. — Thanks @imjlk!

## 0.3.0 — 2026-02-16

### Minor changes

- [204531e](https://github.com/k-otp/k-msg/commit/204531ea503a51fc0ee320fa53cf95f0293f66e8) Integrate Bunli `@bunli/plugin-ai-detect` into the CLI and auto-enable JSON output
  in AI-agent environments (including custom detections for `CODEX_*` and `MCP_*`). — Thanks @imjlk!

## 0.2.0 — 2026-02-15

### Minor changes

- [67c2d28](https://github.com/k-otp/k-msg/commit/67c2d28e0232276e105ff0bcbef5b544990a5e5f) Publish `@k-msg/cli` to npm as a lightweight Node launcher that downloads and runs
  the `bunli build:all` native binaries from GitHub Releases (OIDC publish in CI). — Thanks @imjlk!

## 0.1.1 — 2026-02-15

### Patch changes

- Initial CLI release.

