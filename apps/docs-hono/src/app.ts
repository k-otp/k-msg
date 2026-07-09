import { Hono } from "hono";
import { type DocsPage, loadDocsPages } from "./content";
import { renderPage } from "./render";

let pages: DocsPage[];
try {
  pages = await loadDocsPages();
} catch (error) {
  console.error(
    "[docs-hono] Failed to load docs pages. Ensure the docs source tree exists and imported partials are valid.",
  );
  throw error;
}
const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    pages: pages.length,
    service: "k-msg docs-hono",
  }),
);

for (const page of pages) {
  app.get(page.route, (c) => c.html(renderPage(page)));
}

app.notFound((c) =>
  c.html(
    "<!doctype html><html><body><h1>Not found</h1><p>The Hono docs build could not find this page.</p></body></html>",
    404,
  ),
);

export default app;
