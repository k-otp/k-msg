# k-msg Docs Runbook

Korean version: `README_ko.md`

This is the contributor and operations runbook for the `k-msg` docs site (`https://k-msg.and.guide`).

- Framework: Astro + Starlight
- Default locale: `ko` (Korean), secondary locale: `en`
- Root route: `/` (Korean root locale), English route: `/en/`
- Build output: `apps/docs/dist`

## 1. Quick Start

Run from repository root:

1. Install dependencies: `bun install --frozen-lockfile`
2. Start docs dev server: `bun run docs:dev`
3. Build docs: `bun run docs:build`
4. Run merge gate checks: `bun run docs:check`

## 2. Source-of-Truth Rules

Manually maintained files:

- `apps/docs/src/content/docs/cli.mdx`
- `apps/docs/src/content/docs/en/cli.mdx`
- `apps/docs/src/content/docs/snippets.mdx`
- `apps/docs/src/content/docs/en/snippets.mdx`
- `apps/docs/snippets/**` (code example source)

Generated files:

- `apps/docs/src/content/docs/guides/**` (Korean root locale)
- `apps/docs/src/content/docs/en/guides/**`
- `apps/docs/src/content/docs/api/**` (root locale API source)
- `apps/docs/src/content/docs/en/api/**`
- `apps/docs/src/generated/cli/help.md`
- `apps/docs/src/generated/cli/schema.md`
- `apps/docs/typedoc.entrypoints.json`

Rules:

1. Do not edit generated files directly.
2. If `packages/*`, `apps/cli/*`, or `examples/*` changes, run `bun run docs:generate`.
3. Keep code examples in `apps/docs/snippets/**` only.

## 3. Documentation Automation

`bun run docs:generate` runs the following in order:

1. `scripts/docs/collect-entrypoints.ts`
- Reads package `exports` and builds TypeDoc entrypoints
- Output: `apps/docs/typedoc.entrypoints.json`

2. `scripts/docs/generate-cli-help.ts`
- Captures CLI help output from `apps/cli/src/k-msg.ts`
- Output: `apps/docs/src/generated/cli/help.md`

3. `scripts/docs/generate-schema-docs.ts`
- Generates docs from `apps/cli/schemas/*.json`
- Output: `apps/docs/src/generated/cli/schema.md`

4. `scripts/docs/generate-guides.ts`
- Generates guide pages from repo/package/example `README*.md`
- Output: `apps/docs/src/content/docs/guides/**`, `apps/docs/src/content/docs/en/guides/**`, `index.md`

All generators support `--check`.

## 4. API Docs Generation

Config files:

- `apps/docs/astro.config.mjs`
- `apps/docs/typedoc.tsconfig.json`
- `apps/docs/plugins/sync-typedoc-locales.mjs`

Flow:

1. `starlight-typedoc` generates API docs from `typedoc.entrypoints.json`
2. Source output path: `src/content/docs/api/**`
3. Locale sync plugin copies output to `en/api`
4. `gitRevision: "main"` reduces source-link drift

## 5. Contributor Workflow

When code changes (`packages/*`, `apps/cli/*`, `examples/*`):

1. Update code
2. Run `bun run docs:generate`
3. Review generated changes
4. Run `bun run docs:check`
5. Commit and push

When only docs text changes:

1. Update docs text
2. Run `bun run docs:generate` if needed
3. Run `bun run docs:check`
4. Commit and push

## 6. CI Gate

Workflow:

- `.github/workflows/ci.yml` -> `docs-check` job

Path filters:

- `packages/**`
- `apps/cli/**`
- `examples/**`
- `apps/docs/**`
- `scripts/docs/**`
- `package.json`
- `bun.lock`

Verification command:

- `bun run docs:check`
- Failing checks block PR merge

## 7. Cloudflare Pages

- Project name: `k-msg`
- Production branch: `main`
- Build command: `bun install --frozen-lockfile && bun run docs:build`
- Output directory: `apps/docs/dist`
- Custom domain: `k-msg.and.guide`
- PR Preview: enabled

Note:

- `astro build` generates `sitemap-index.xml` in `apps/docs/dist`.
- Sitemap metadata is customized with `lastmod`, `changefreq`, and `priority` in `apps/docs/astro.config.mjs`.
- `apps/docs/public/robots.txt` advertises the canonical sitemap URL.
