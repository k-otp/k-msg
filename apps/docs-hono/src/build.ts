import path from "node:path";
import { toSSG } from "hono/bun";
import app from "./app";

const outputDir = path.join(import.meta.dir, "..", "dist");
const result = await toSSG(app, {
  concurrency: 8,
  dir: outputDir,
});

if (!result.success) {
  throw result.error ?? new Error("Failed to generate docs-hono output");
}

console.log(
  `[docs-hono] generated ${result.files.length} file(s) into ${outputDir}`,
);
