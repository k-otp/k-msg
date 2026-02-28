# CI Helper Scripts

## `check-bundle-size.sh`

Guards published ESM artifact size regressions with fixed byte thresholds.

- Script path: `scripts/ci/check-bundle-size.sh`
- CI job: `bundle-size` in `.github/workflows/ci.yml`
- Scope: `@k-msg/core`, `@k-msg/template` (subpaths), `@k-msg/messaging`, `@k-msg/provider`, `k-msg`
- Enforces both `raw` and `gzip` thresholds per artifact.
- Includes send-only forbidden import checks:
  - `zod` (sender/send-only bundles)
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
  - package tarball contains `package.json` and at least one `dist/` file
  - package tarball excludes sourcemap files (`.map`)
  - `k-msg` tarball includes `dist/index.mjs` and `dist/core/index.mjs`
