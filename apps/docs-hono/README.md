# docs-hono

Parallel Hono SSG docs app for the `k-msg` repository.

Current purpose:

- prove the docs site can be rendered from framework-neutral Markdown inputs
- keep the output static so Cloudflare Pages can deploy it directly
- remove the Astro/Starlight/TypeDoc runtime from the critical path for TypeScript 7 adoption

Local commands:

```bash
bun run --cwd apps/docs-hono dev
bun run --cwd apps/docs-hono build
bun run --cwd apps/docs-hono typecheck
```

Cloudflare Pages target settings for this app:

- Root directory: `apps/docs-hono`
- Build command: `bun install --frozen-lockfile && bun run build`
- Build output directory: `dist`
