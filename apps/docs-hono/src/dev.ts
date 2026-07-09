import app from "./app";

const port = Number(process.env.PORT ?? 4322);

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`[docs-hono] dev server running on http://127.0.0.1:${port}`);
