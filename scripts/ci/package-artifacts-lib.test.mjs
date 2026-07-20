import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  collectPackageArtifactTargets,
  inspectBuiltPackage,
  inspectPackedPackage,
  normalizePackageTarget,
} from "./package-artifacts-lib.mjs";

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "k-msg-artifacts-"));
  mkdirSync(path.join(root, "dist"));
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "@k-msg/fixture",
      type: "module",
      main: "./dist/index.js",
      module: "./dist/index.mjs",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.mjs",
          require: "./dist/index.js",
        },
      },
    }),
  );
  writeFileSync(path.join(root, "dist/index.mjs"), "export const ok = true;\n");
  writeFileSync(path.join(root, "dist/index.js"), "exports.ok = true;\n");
  writeFileSync(
    path.join(root, "dist/index.d.ts"),
    "export declare const ok: true;\n",
  );
  return root;
}

test("collects condition-specific and legacy artifact targets", () => {
  const targets = collectPackageArtifactTargets({
    main: "dist/index.js",
    module: "dist/index.mjs",
    exports: {
      ".": {
        node: { import: "./dist/node.mjs", require: "./dist/node.cjs" },
        default: "./dist/default.mjs",
      },
    },
  });
  assert.ok(
    targets.some(
      (target) =>
        target.condition === "import" && target.target === "./dist/node.mjs",
    ),
  );
  assert.ok(
    targets.some(
      (target) =>
        target.condition === "require" && target.target === "./dist/node.cjs",
    ),
  );
  assert.ok(
    targets.some(
      (target) =>
        target.condition === "import" && target.target === "dist/index.mjs",
    ),
  );
});

test("rejects package target traversal", () => {
  assert.throws(
    () => normalizePackageTarget("./dist/../../secret.mjs"),
    /escapes the package/,
  );
});

test("detects invalid ESM exports in built artifacts", () => {
  const root = createFixture();
  try {
    assert.deepEqual(inspectBuiltPackage(root).errors, []);
    writeFileSync(path.join(root, "dist/index.mjs"), "export { missing };\n");
    assert.match(
      inspectBuiltPackage(root).errors.join("\n"),
      /invalid ESM artifact/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("requires every export target and excludes sourcemaps from npm packs", () => {
  const root = createFixture();
  try {
    const result = inspectPackedPackage(root, {
      files: [
        { path: "package.json" },
        { path: "dist/index.mjs" },
        { path: "dist/index.mjs.map" },
      ],
    });
    const errors = result.errors.join("\n");
    assert.match(errors, /sourcemap must not be published/);
    assert.match(errors, /packed artifact is missing.*dist\/index\.js/);
    assert.match(errors, /packed artifact is missing.*dist\/index\.d\.ts/);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("reports malformed npm pack JSON as a CI annotation", () => {
  const root = createFixture();
  const packJson = path.join(root, "pack.json");
  writeFileSync(packJson, "not json\n");
  try {
    const cli = fileURLToPath(
      new URL("./check-package-artifacts.mjs", import.meta.url),
    );
    const result = spawnSync(
      process.execPath,
      [cli, "--pack-json", root, packJson],
      {
        encoding: "utf8",
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /::error::/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
