# @k-msg/cli

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

