# docs-hono

Hono SSG docs app for the `k-msg` repository.

Current purpose:

- render the docs site from framework-neutral Markdown inputs
- ingest generated API reference pages from the API Extractor pipeline
- keep the output static so Cloudflare Pages can deploy it directly
- remove the Astro/Starlight/TypeDoc runtime from the critical path for TypeScript 7 adoption

Local commands:

```bash
bun run docs-hono:dev
bun run docs-hono:build
bun run --cwd apps/docs-hono typecheck
```

Cloudflare Pages target settings for this app:

- Root directory: repository root
- Build command: `bun install --frozen-lockfile && bun run docs-hono:build`
- Build output directory: `apps/docs-hono/dist`
