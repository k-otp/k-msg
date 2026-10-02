import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { inspectForbiddenImports } from "./forbidden-imports";

// Each case builds a fixture package the way the real packages build theirs
// (bun build, minified ESM, linked sourcemap), so the guard reads the same
// shape of artifact as in CI.

let packageDir: string;

function write(relativePath: string, content: string): void {
  const file = path.join(packageDir, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

async function buildEntry(name: string, source: string): Promise<string> {
  write(`src/${name}/index.ts`, source);
  const result = await Bun.build({
    entrypoints: [path.join(packageDir, `src/${name}/index.ts`)],
    root: path.join(packageDir, "src"),
    outdir: path.join(packageDir, "dist"),
    format: "esm",
    minify: true,
    sourcemap: "linked",
    naming: "[dir]/[name].mjs",
    external: ["zod", "zod/*", "@k-msg/*"],
  });
  if (!result.success) throw new AggregateError(result.logs, "build failed");
  return path.join(packageDir, `dist/${name}/index.mjs`);
}

beforeAll(() => {
  packageDir = mkdtempSync(path.join(tmpdir(), "k-msg-forbidden-imports-"));
  write("package.json", JSON.stringify({ name: "fixture", type: "module" }));
  write(
    "node_modules/drizzle-orm/package.json",
    JSON.stringify({ name: "drizzle-orm", type: "module", main: "index.js" }),
  );
  write(
    "node_modules/drizzle-orm/index.js",
    "export function sql(text) { return { text, at: Date.now() }; }\n",
  );
});

afterAll(() => {
  rmSync(packageDir, { recursive: true, force: true });
});

describe("inspectForbiddenImports", () => {
  test("passes an artifact that only names a package in a string", async () => {
    const artifact = await buildEntry(
      "clean",
      `export const message = "this bundle does not import zod or drizzle-orm";\n`,
    );

    expect(
      inspectForbiddenImports(artifact, packageDir, ["zod", "drizzle-orm"]),
    ).toEqual({ violations: [], problems: [] });
  });

  test("detects an import of a forbidden package subpath", async () => {
    const artifact = await buildEntry(
      "external",
      `import { z } from "zod/mini";\nexport const schema = z.string();\n`,
    );

    expect(inspectForbiddenImports(artifact, packageDir, ["zod"])).toEqual({
      violations: ["import-statement of 'zod/mini'"],
      problems: [],
    });
  });

  test("detects a dynamic import of a forbidden workspace package", async () => {
    const artifact = await buildEntry(
      "dynamic",
      `export const load = () => import("@k-msg/template/send");\n`,
    );

    expect(
      inspectForbiddenImports(artifact, packageDir, ["@k-msg/template"]),
    ).toEqual({
      violations: ["dynamic-import of '@k-msg/template/send'"],
      problems: [],
    });
  });

  test("detects a forbidden package the bundle inlines", async () => {
    const artifact = await buildEntry(
      "inlined",
      `import { sql } from "drizzle-orm";\nexport const query = sql("select 1");\n`,
    );

    const report = inspectForbiddenImports(artifact, packageDir, [
      "drizzle-orm",
    ]);
    expect(report.problems).toEqual([]);
    expect(report.violations).toEqual(["1 inlined module(s) of 'drizzle-orm'"]);
  });

  test("fails an artifact without a sourcemap instead of passing it", async () => {
    const artifact = await buildEntry("unmapped", `export const value = 1;\n`);
    writeFileSync(artifact, "export const value = 1;\n");

    expect(inspectForbiddenImports(artifact, packageDir, ["zod"])).toEqual({
      violations: [],
      problems: ["cannot check inlined modules: it links no sourcemap"],
    });
  });

  test("fails a missing artifact", () => {
    expect(
      inspectForbiddenImports(
        path.join(packageDir, "dist/missing/index.mjs"),
        packageDir,
        ["zod"],
      ),
    ).toEqual({ violations: [], problems: ["the artifact is missing"] });
  });
});
