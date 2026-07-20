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
  listPublishablePackageDirs,
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
        import: "./dist/index.mjs",
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
        target.condition === "import" && target.target === "./dist/index.mjs",
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

test("collects nested conditional declaration targets without treating them as runtime", () => {
  const targets = collectPackageArtifactTargets({
    exports: {
      ".": {
        types: {
          import: "./dist/index.d.mts",
          require: "./dist/index.d.cts",
        },
        import: {
          types: "./dist/import.d.mts",
          default: "./dist/index.mjs",
        },
        require: {
          types: "./dist/require.d.cts",
          default: "./dist/index.cjs",
        },
      },
    },
  });
  const targetKeys = new Set(
    targets.map(({ condition, target }) => `${condition}:${target}`),
  );
  assert.ok(targetKeys.has("types:./dist/index.d.mts"));
  assert.ok(targetKeys.has("types:./dist/index.d.cts"));
  assert.ok(targetKeys.has("types:./dist/import.d.mts"));
  assert.ok(targetKeys.has("types:./dist/require.d.cts"));
  assert.ok(targetKeys.has("import:./dist/index.mjs"));
  assert.ok(targetKeys.has("require:./dist/index.cjs"));
  assert.equal(targetKeys.has("import:./dist/index.d.mts"), false);
  assert.equal(targetKeys.has("require:./dist/index.d.cts"), false);
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

test("resolves relative npm pack JSON paths from the repository root", () => {
  const root = createFixture();
  const packJson = path.join(root, "pack.json");
  writeFileSync(
    packJson,
    JSON.stringify([
      {
        files: [
          { path: "package.json" },
          { path: "dist/index.mjs" },
          { path: "dist/index.js" },
          { path: "dist/index.d.ts" },
        ],
      },
    ]),
  );
  try {
    const cli = fileURLToPath(
      new URL("./check-package-artifacts.mjs", import.meta.url),
    );
    const repositoryRoot = path.resolve(path.dirname(cli), "../..");
    const result = spawnSync(
      process.execPath,
      [cli, "--pack-json", root, path.relative(repositoryRoot, packJson)],
      {
        cwd: tmpdir(),
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("rejects a workspace with no publishable packages", () => {
  const root = mkdtempSync(path.join(tmpdir(), "k-msg-workspace-"));
  mkdirSync(path.join(root, "packages"));
  try {
    assert.throws(
      () => listPublishablePackageDirs(root),
      /no publishable packages found/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test("reports the directory for an unreadable package manifest", () => {
  const root = mkdtempSync(path.join(tmpdir(), "k-msg-workspace-"));
  mkdirSync(path.join(root, "packages/fixture"), { recursive: true });
  try {
    assert.throws(
      () => listPublishablePackageDirs(root),
      /unable to read package manifest .*packages[/\\]fixture[/\\]package\.json/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
