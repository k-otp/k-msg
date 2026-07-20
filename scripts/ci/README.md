# CI Helper Scripts

## `check-bundle-size.sh`

Guards published ESM artifact size regressions with fixed byte thresholds.

- Script path: `scripts/ci/check-bundle-size.sh`
- CI job: `bundle-size` in `.github/workflows/ci.yml`
- Scope: `@k-msg/core`, `@k-msg/template` (subpaths), `@k-msg/messaging`, `@k-msg/provider`, `k-msg`
- Enforces both `raw` and `gzip` thresholds per artifact.
- Includes send-only forbidden import checks:
  - `zod` (sender/send-only bundles)
  - `zod/mini` (sender/send-only bundles)
  - `drizzle-orm` (sender/send-only bundles)
  - `@k-msg/template` (provider send-only bundles)

### Threshold Update Policy

Use this order before changing limits:

1. Reproduce locally with `./scripts/ci/check-bundle-size.sh`.
2. Confirm growth is intentional and not a dependency inlining regression.
3. Prefer code-splitting/subpath import fixes over raising limits.
4. Raise only impacted artifact limits, keep a narrow delta.
5. Include measured before/after bytes in PR description.

## `npm-pack-smoke.sh`

Validates publishable package tarballs with `npm pack --dry-run --json`.

- Script path: `scripts/ci/npm-pack-smoke.sh`
- Release hook: `Pre-publish npm pack smoke checks` in `.github/workflows/release.yml`
- Ensures:
  - package tarball generation succeeds
  - every `exports`, `main`, `module`, and `types` artifact is present
  - package tarball excludes sourcemap files (`.map`)
  - built ESM entrypoints pass the package artifact contract below

## `check-package-artifacts.mjs`

Validates the built files that are referenced by each publishable package
manifest.

- Script path: `scripts/ci/check-package-artifacts.mjs`
- Unit tests: `scripts/ci/package-artifacts-lib.test.mjs`
- Canonical gate: `bun run check:package-artifacts` (included in `check:ci`)
- Enforces:
  - root `main`, `module`, and `types` fields agree with the matching root
    `exports` conditions
  - every public artifact target exists
  - every ESM target uses the project `.mjs` convention and passes
    `node --check`
  - every export target is included by `npm pack --dry-run`

The `.mjs` check is intentional. Published packages reserve `.mjs` for the
`import` condition and `.js` for the separately built CommonJS `require`
condition, even though package manifests use `"type": "module"`.

### Bun build baseline

Bun `1.3.10` through `1.3.14` emit invalid ESM for several barrel re-export
entrypoints in this workspace. The generated files export identifiers whose
definitions were removed, so source tests and TypeScript checks pass while
Node rejects the published artifact. Bun `1.3.9` is the newest verified-good
builder and remains pinned in package manifests and workflows.

Do not advance the Bun baseline until the candidate version passes all of:

1. `bun run build:all`
2. `bun run check:package-artifacts`
3. `bash ./scripts/ci/npm-pack-smoke.sh`
4. `bash ./scripts/ci/check-bundle-size.sh`

Run every command with the same candidate Bun binary that the release workflow
will use.
