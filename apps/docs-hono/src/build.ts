import { cp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { toSSG } from "hono/bun";
import { loadDocsPages } from "./content";
import { robotsText } from "./site";
import { writeSitemapFiles } from "./sitemap";

process.env.NODE_ENV ??= "production";
const { default: app } = await import("./app");

const outputDir = path.join(import.meta.dir, "..", "dist");
const publicDir = path.join(import.meta.dir, "..", "public");
const pages = await loadDocsPages();

await rm(outputDir, { force: true, recursive: true });

const result = await toSSG(app, {
  concurrency: 8,
  dir: outputDir,
});

if (!result.success) {
  throw result.error ?? new Error("Failed to generate docs-hono output");
}

try {
  await cp(publicDir, outputDir, { force: true, recursive: true });
} catch (error) {
  const maybeCode =
    error && typeof error === "object" && "code" in error ? error.code : null;
  if (maybeCode !== "ENOENT") {
    throw error;
  }
}

await writeFile(path.join(outputDir, "robots.txt"), robotsText(), "utf8");
await writeSitemapFiles({ outputDir, pages });

console.log(
  `[docs-hono] generated ${result.files.length} file(s) into ${outputDir}`,
);
