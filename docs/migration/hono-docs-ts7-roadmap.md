# Hono Docs + TS7 Roadmap

This roadmap defines the staged migration from the current Astro/Starlight/TypeDoc docs stack to a Hono SSG-based static docs architecture, while also moving the repository toward TypeScript 7 and `ttsc` as first-class tooling.

## Why This Migration Exists

The current docs site blocks aggressive TypeScript 7 adoption for two different reasons:

1. `typedoc` and `starlight-typedoc` are still tied to the pre-TS7 programmatic compiler world.
2. The docs runtime itself depends on Astro/MDX/Starlight integration points that TypeScript 7 does not currently help much with.

The practical consequence is that the main source packages and CLI are already good candidates for TS7/`ttsc`, but the docs stack is still the slowest-moving compatibility boundary.

## Target End State

### Docs runtime

- `apps/docs-hono` becomes the new docs app.
- The app uses `Hono` route modules plus `hono/jsx` for the site shell.
- Static output is generated with `toSSG(...)` into a deployable `dist/` directory.
- Search is handled by `Pagefind` after static generation.
- GA4 and Clarity are injected by the Hono shell and tracked explicitly for client-side navigation.

### Docs content

- Guide and package/example docs move to framework-neutral Markdown as the source of truth.
- CLI help and schema docs remain generated artifacts.
- API docs move from `TypeDoc` to an `API Extractor`-driven pipeline.
- Locale handling remains explicit (`ko` root, `en` prefixed) and is rendered by route generation rather than framework magic.

### Workspace TypeScript/tooling

- TypeScript 7 becomes the main typecheck compiler for the workspace where programmatic API blockers have been removed.
- `ttsc` becomes the preferred fast validation lane for package and CLI typechecking.
- `ttsc-graph` becomes a supported repo tool for architecture and flow inspection.
- Legacy `tsc` usage is reduced to the places that still need declaration emit or ecosystem compatibility during transition.

## Migration Constraints

### Hard blockers to remove

- `apps/docs` currently depends on:
  - `astro`
  - `@astrojs/starlight`
  - `starlight-typedoc`
  - `typedoc`
  - `typedoc-plugin-markdown`
- Current docs sources include MDX imports and Starlight-only components.
- Existing docs generation writes directly into the Astro content tree.

### What should stay stable

- URL structure should stay compatible where practical:
  - `/`
  - `/en/`
  - `/guides/**`
  - `/api/**`
  - `/cli/`
  - `/snippets/`
- Cloudflare Pages remains the default deployment target for the docs site.
- Existing guide generation from package/example `README*.md` files remains valuable and should not be thrown away.

## Repo Inputs Already Available

- Hono is already present in the workspace catalog.
- Bun is already the package manager and a good fit for a Hono SSG build script.
- The repository already has a TS7/`ttsc` validation lane:
  - `bun run typecheck:ttsc:ts7`
  - `bun run graph:ttsc:ts7`
  - `bun run benchmark:ttsc:ts7`
- Existing docs automation already centralizes content generation in `scripts/docs/*`, which can be retargeted away from Astro.

## Staged PR Plan

### PR 1: Planning baseline and source audit

- Add a migration roadmap that fixes the target architecture and transition order.
- Add a source audit that tells us which docs files are plain-Markdown compatible and which still contain Astro/Starlight/MDX constructs.
- Keep this PR implementation-light so later PRs have a stable execution reference.

### PR 2: Scaffold `apps/docs-hono`

- Create a new Hono SSG docs app alongside the current Astro app.
- Provide:
  - `dev`
  - `build`
  - `preview`
  - `typecheck`
- Render a minimal site shell with:
  - locale-aware layout
  - top-level navigation
  - GA4 + Clarity bootstrapping
  - static asset support
- Generate `dist/` with `toSSG(...)`.

### PR 3: Framework-neutral docs data layer

- Refactor docs generation so it emits framework-neutral content/manifests instead of writing directly to the Astro content tree.
- Introduce manifests for:
  - guides
  - package docs
  - example docs
  - CLI generated docs
  - locale metadata
- Update the Hono docs app to render from these manifests.

### PR 4: API docs migration off TypeDoc

- Replace `typedoc.entrypoints.json` generation with an `API Extractor`-driven package inventory and extraction pipeline.
- Emit API markdown/pages that the Hono app can render directly.
- Preserve source links and package grouping.
- Remove TypeDoc/Starlight dependencies from the active docs build path.

### PR 5: TS7 + `ttsc` promotion

- Promote workspace default typecheck toward TypeScript 7.
- Keep a narrow fallback path only where declaration emit or third-party tooling still forces it.
- Retarget docs checks to the Hono app so Astro-specific typecheck is no longer part of the root path.
- Add `ttsc`-first validation to CI once parity is proven.

### PR 6: Astro retirement

- Cut over root docs scripts to `apps/docs-hono`.
- Remove `apps/docs` runtime dependencies and stale generators.
- Update Cloudflare Pages root/build/output settings if needed.
- Delete retired Astro/Starlight/TypeDoc integration code.

## TS7 And `ttsc` Adoption Strategy

### Near term

- Keep validating packages and CLI with the isolated TS7/`ttsc` lane.
- Move the docs migration first, because that is the main ecosystem blocker.
- Avoid broad mechanical TypeScript 7 promotion while the old docs runtime still exists.

### After Hono cutover

- Move root `typescript` to TS7.
- Evaluate whether any remaining programmatic tools still need a temporary TypeScript 6 compatibility package.
- Prefer `ttsc --noEmit` for default type validation.
- Keep `tsc` only where declaration output or packaging still depends on it.

### `ttsc-graph`

- Treat `ttsc-graph` as a supported repository tool, not just an experiment.
- Add docs and helper scripts for:
  - root workspace graph server
  - root graph dump
  - package-scoped graph inspection

## Cloudflare Pages Deployment Model

- Build command should remain explicit and static-site oriented.
- Hono SSG should emit a plain output directory such as `apps/docs-hono/dist`.
- Pages can deploy any custom build output directory, which fits the Hono SSG model well.
- Monorepo root/build path separation should be used so docs builds do not trigger unnecessarily for unrelated app changes.

## Exit Criteria

The migration is considered complete when all of the following are true:

- Hono SSG is the only active docs runtime.
- `TypeDoc`, `starlight-typedoc`, and `@astrojs/starlight` are no longer required by the docs build path.
- Root docs build/check commands no longer depend on Astro.
- The new docs site preserves core navigation, locale split, CLI docs, API docs, sitemap, analytics, and search.
- TypeScript 7 plus `ttsc` are part of the normal workspace validation path, not just an isolated experiment.
