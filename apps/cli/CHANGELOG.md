# @k-msg/cli

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

