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
  - built ESM and CommonJS entrypoints pass the package artifact contract
    below

## `check-package-artifacts.mjs`

Validates the built files that are referenced by each publishable package
manifest.

- Script path: `scripts/ci/check-package-artifacts.mjs`
- Artifact loader: `scripts/ci/load-package-artifact.mjs`
- Unit tests: `scripts/ci/package-artifacts-lib.test.mjs`
- Canonical gate: `bun run check:package-artifacts` (included in `check:ci`)
- Enforces:
  - root `main`, `module`, and `types` fields agree with the matching root
    `exports` conditions
  - every public artifact target exists
  - every `import` target is named `.mjs` and every `require` target `.cjs`
  - every runtime target loads in a fresh Node process, with `import()` for
    `import` targets and `require()` for `require` targets, has at least one
    export, and every export reads as a defined value
  - the `import` and `require` targets of each export subpath expose the
    same export names
  - no runtime target inlines a package that the manifest lists in
    `dependencies`, `optionalDependencies`, or `peerDependencies`
    (see [Inlined dependencies](#inlined-dependencies))
  - every export target is included by `npm pack --dry-run`

Published packages keep `"type": "module"`, so each runtime artifact carries
its format in its extension: `.mjs` for the `import` condition and `.cjs` for
the separately built CommonJS `require` condition. Node loads a `.js` file in
a `"type": "module"` package as ESM, so a CommonJS build named `.js` throws
`ReferenceError: module is not defined in ES module scope` under `require()`.

`@k-msg/messaging/adapters/bun` and `k-msg/adapters/bun` import `bun:sqlite`,
which Node cannot load. `BUN_ONLY_EXPORTS` in `package-artifacts-lib.mjs`
lists them, and the gate only syntax-checks their artifacts with
`node --check`.

### Inlined dependencies

npm installs a package's `dependencies`, `optionalDependencies`, and
`peerDependencies` for the consumer, so an artifact that also inlines one
ships a second copy. An error thrown by an inlined copy of `@k-msg/core`
fails `instanceof KMsgError` in the consumer's code, and the consumer's
`setGlobalLogger()` never reaches the inlined logger. A package's
`build:esm` and `build:cjs` scripts must therefore pass `--external` for its
runtime dependencies, for example `--external '@k-msg/*' --external 'zod'`.

The gate reads which packages a runtime target inlines from its linked
sourcemap, so a package with runtime dependencies must build with
`--sourcemap`. A source under `node_modules/<name>/` belongs to that package,
and any other source to the package of its nearest `package.json`. Bun 1.4.2
writes the sources of an entry built into a subdirectory of the outdir
relative to the outdir instead of to the map, so the gate resolves each
source against the map's directory and then each parent up to the package
directory, and reports a source it cannot find rather than guess its owner.

`INLINED_DEPENDENCIES` in `package-artifacts-lib.mjs` lists what
`@k-msg/analytics`, `@k-msg/channel`, and `@k-msg/template` still inline.
The entries are defects to fix, not exemptions: remove one once the
package's build marks the dependency external. The gate rejects an entry
that no artifact inlines.

### Bun build baseline

Bun `1.3.10` through `1.4.0` emit broken bundles for entrypoints that only
re-export (`export { x } from "./x"`) in packages that declare
`"sideEffects": false`. Bun's barrel import optimization treats such an
entrypoint as a barrel, skips the re-exported modules, and still emits the
export clause ([oven-sh/bun#40578](https://github.com/oven-sh/bun/issues/40578)).
Source tests and TypeScript checks still pass. The ESM output exports
undeclared identifiers, which Node rejects when it parses the file; the
CommonJS output is broken the same way but only throws a `ReferenceError` when
an export is read, which this gate catches because it reads every export. No
`--minify*` or `--splitting` flag avoids it. Bun
`1.4.1` fixed it ([oven-sh/bun#40580](https://github.com/oven-sh/bun/pull/40580)),
and Bun `1.4.2` is the verified builder pinned in package manifests and
workflows.

Do not advance the Bun baseline until the candidate version passes all of:

1. `bun run build:all`
2. `bun run check:package-artifacts`
3. `bash ./scripts/ci/npm-pack-smoke.sh`
4. `bash ./scripts/ci/check-bundle-size.sh`

Run every command with the same candidate Bun binary that the release workflow
will use.
