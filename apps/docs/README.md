# k-msg Docs Runbook

Korean version: `README_ko.md`

This is the contributor and operations runbook for the `k-msg` docs site (`https://k-msg.and.guide`).

- Active site runtime: Hono SSG (`apps/docs-hono`)
- Source-content workspace: `apps/docs` owns plain Markdown sources, generated docs inputs, and snippet source files
- Default locale: `ko` (Korean), secondary locale: `en`
- Root route: `/` (Korean root locale), English route: `/en/`
- Build output: `apps/docs-hono/dist`

## 1. Quick Start

Run from repository root:

1. Install dependencies: `bun install --frozen-lockfile`
2. Start docs dev server: `bun run docs:dev`
3. Build docs: `bun run docs:build`
4. Run merge gate checks: `bun run docs:check`

## 2. Source-of-Truth Rules

Manually maintained files:

- `apps/docs/src/content/docs/cli.md`
- `apps/docs/src/content/docs/en/cli.md`
- `apps/docs/src/content/docs/snippets.md`
- `apps/docs/src/content/docs/en/snippets.md`
- `apps/docs/snippets/**` (code example source)

Generated files:

- `apps/docs/src/content/docs/guides/**` (Korean root locale)
- `apps/docs/src/content/docs/en/guides/**`
- `apps/docs/src/generated/cli/help.md`
- `apps/docs/src/generated/cli/schema.md`
- `apps/docs/api-sources.json`

Generated runtime output outside this workspace:

- `apps/docs-hono/content/docs/api/**`
- `apps/docs-hono/content/docs/en/api/**`

Rules:

1. Do not edit generated files directly.
2. If `packages/*`, `apps/cli/*`, or `examples/*` changes, run `bun run docs:generate`.
3. Keep code examples in `apps/docs/snippets/**` only.

## 3. Documentation Automation

`bun run docs:generate` runs the following in order:

1. `scripts/docs/collect-entrypoints.ts`
- Reads package `exports` and writes the API source inventory consumed by the docs pipeline
- Output: `apps/docs/api-sources.json`

2. `scripts/docs/generate-cli-help.ts`
- Captures CLI help output from `apps/cli/src/k-msg.ts`
- Output: `apps/docs/src/generated/cli/help.md`

3. `scripts/docs/sync-tracking-schema-docs.ts`
- Syncs tracked schema reference pages into the docs source tree

4. `scripts/docs/generate-schema-docs.ts`
- Generates docs from `apps/cli/schemas/*.json`
- Output: `apps/docs/src/generated/cli/schema.md`

5. `scripts/docs/generate-static-pages.ts`
- Rebuilds plain-Markdown landing pages for `cli` and `snippets`

6. `scripts/docs/generate-guides.ts`
- Generates guide pages from repo/package/example `README*.md`
- Output: `apps/docs/src/content/docs/guides/**`, `apps/docs/src/content/docs/en/guides/**`, `index.md`

7. `scripts/docs/export-hono-content.ts`
- Validates that docs content stays plain-Markdown compatible and copies it into the Hono app content tree

8. `scripts/docs/generate-api-extractor-docs.ts`
- Builds API markdown from the `apps/docs/api-sources.json` inventory with API Extractor + API Documenter

All generators support `--check`.

Note:

- `bun run scripts/docs/run-generate.ts --check` intentionally skips `scripts/docs/generate-cli-help.ts`, `scripts/docs/generate-schema-docs.ts`, `scripts/docs/export-hono-content.ts`, and `scripts/docs/generate-api-extractor-docs.ts`.
- `apps/docs/src/generated/cli/help.md` and `apps/docs/src/generated/cli/schema.md` are generated during docs build (`docs:build` / Pages deploy), not enforced by `docs:check`.
- `apps/docs/src/generated/cli/help.md` and `apps/docs/src/generated/cli/schema.md` are not tracked in Git.

`bun run docs:build` also runs:

- `scripts/docs/ensure-git-history.ts` (before docs generation)
- In CI/Pages shallow clones, it attempts to deepen git history for accurate sitemap `lastmod`
- Default policy is fail-open (warn and continue). Set `DOCS_REQUIRE_GIT_HISTORY=1` for strict mode.

## 4. API Docs Generation

Flow:

1. `scripts/docs/collect-entrypoints.ts` builds `apps/docs/api-sources.json` from package `exports`
2. `scripts/docs/generate-api-extractor-docs.ts` runs API Extractor and API Documenter against that inventory
3. Generated API pages land in `apps/docs-hono/content/docs/api/**` and `apps/docs-hono/content/docs/en/api/**`
4. `scripts/docs/export-hono-content.ts` copies the normalized Markdown source pages into the Hono app content tree
5. Source links remain anchored to the repository paths recorded in the inventory

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
- `bun run docs:check:sitemap-lastmod` (included in `docs:check`)
- Failing checks block PR merge

## 7. Cloudflare Pages

- Project name: `k-msg`
- Production branch: `main`
- Build command: `bun install --frozen-lockfile && bun run docs:build`
- Output directory: `apps/docs-hono/dist`
- Custom domain: `k-msg.and.guide`
- PR Preview: enabled

Note:

- `bun run docs-hono:build` generates `sitemap-index.xml` in `apps/docs-hono/dist`.
- Sitemap metadata is post-processed by `scripts/docs/postprocess-sitemap.ts` and verified by `scripts/docs/check-sitemap-lastmod.ts`.
- `apps/docs-hono/public/sitemap.xsl` and the Hono build emit the canonical sitemap assets.

## 8. Troubleshooting

If sitemap `/api/` pages show the same `lastmod` value:

1. Check build logs for `scripts/docs/ensure-git-history.ts`
2. Confirm one of these appears:
- `ok: git history prepared via: ...`
- `ok: repository already has full history`
3. If only warning logs appear, the build likely stayed shallow; `lastmod` precision may degrade
4. To enforce strict behavior in CI/Pages, set `DOCS_REQUIRE_GIT_HISTORY=1`
