import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  BUN_ONLY_EXPORTS,
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
      main: "./dist/index.cjs",
      module: "./dist/index.mjs",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.mjs",
          require: "./dist/index.cjs",
        },
      },
    }),
  );
  writeFileSync(path.join(root, "dist/index.mjs"), "export const ok = true;\n");
  writeFileSync(path.join(root, "dist/index.cjs"), "exports.ok = true;\n");
  writeFileSync(
    path.join(root, "dist/index.d.ts"),
    "export declare const ok: true;\n",
  );
  return root;
}

function withFixture(run) {
  const root = createFixture();
  try {
    run(root);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}

function updateManifest(root, update) {
  const file = path.join(root, "package.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  update(manifest);
  writeFileSync(file, JSON.stringify(manifest));
}

function addBunOnlyExport(root) {
  updateManifest(root, (manifest) => {
    manifest.exports["./adapters/bun"] = {
      types: "./dist/bun.d.ts",
      import: "./dist/bun.mjs",
      require: "./dist/bun.cjs",
    };
  });
  writeFileSync(
    path.join(root, "dist/bun.mjs"),
    'import { Database } from "bun:sqlite";\nexport { Database };\n',
  );
  writeFileSync(
    path.join(root, "dist/bun.cjs"),
    'exports.Database = require("bun:sqlite").Database;\n',
  );
  writeFileSync(
    path.join(root, "dist/bun.d.ts"),
    "export declare const Database: unknown;\n",
  );
}

test("collects condition-specific and legacy artifact targets", () => {
  const targets = collectPackageArtifactTargets({
    main: "dist/index.cjs",
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

test("loads ESM exports with import() and CommonJS exports with require()", () => {
  withFixture((root) => {
    const result = inspectBuiltPackage(root);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.checkedEsm, ["dist/index.mjs"]);
    assert.deepEqual(result.checkedCjs, ["dist/index.cjs"]);
  });
});

test("rejects CommonJS exports that are not named .cjs", () => {
  withFixture((root) => {
    updateManifest(root, (manifest) => {
      manifest.main = "dist/index.js";
      manifest.exports["."].require = "./dist/index.js";
    });
    writeFileSync(path.join(root, "dist/index.js"), "exports.ok = true;\n");
    assert.deepEqual(inspectBuiltPackage(root).errors, [
      "@k-msg/fixture: CommonJS export must use .cjs: dist/index.js",
    ]);
  });
});

test("reports CommonJS artifacts that fail under require()", () => {
  for (const [source, problem] of [
    ["export const ok = true;\n", /require\(\) threw SyntaxError/],
    ["module.exports = {};\n", /\(no exports\)/],
    ["exports.ok = undefined;\n", /\(export ok is undefined\)/],
    [
      // Bun 1.3.10 through 1.4.0 emitted getters for bindings they dropped.
      'Object.defineProperty(exports, "ok", { enumerable: true, get: () => dropped });\n',
      /reading export ok threw ReferenceError: dropped is not defined/,
    ],
  ]) {
    withFixture((root) => {
      writeFileSync(path.join(root, "dist/index.cjs"), source);
      const errors = inspectBuiltPackage(root).errors.join("\n");
      assert.match(errors, /invalid CommonJS artifact dist\/index\.cjs/);
      assert.match(errors, problem);
    });
  }
});

test("reports ESM artifacts that throw under import()", () => {
  withFixture((root) => {
    writeFileSync(
      path.join(root, "dist/index.mjs"),
      'export const ok = true;\nthrow new Error("boom");\n',
    );
    assert.match(
      inspectBuiltPackage(root).errors.join("\n"),
      /invalid ESM artifact dist\/index\.mjs \(import\(\) threw Error: boom\)/,
    );
  });
});

test("requires import() and require() to expose the same export names", () => {
  withFixture((root) => {
    writeFileSync(
      path.join(root, "dist/index.mjs"),
      "export const ok = true;\nexport const extra = 1;\n",
    );
    assert.deepEqual(inspectBuiltPackage(root).errors, [
      "@k-msg/fixture: exports[.].require (dist/index.cjs) is missing extra exported by dist/index.mjs",
    ]);

    writeFileSync(
      path.join(root, "dist/index.mjs"),
      "export const ok = true;\n",
    );
    writeFileSync(
      path.join(root, "dist/index.cjs"),
      "exports.ok = true;\nexports.extra = 1;\n",
    );
    assert.deepEqual(inspectBuiltPackage(root).errors, [
      "@k-msg/fixture: exports[.].import (dist/index.mjs) is missing extra exported by dist/index.cjs",
    ]);
  });
});

test("ignores output that a module prints while loading", () => {
  withFixture((root) => {
    writeFileSync(
      path.join(root, "dist/index.cjs"),
      'console.log("loaded");\nexports.ok = true;\n',
    );
    assert.deepEqual(inspectBuiltPackage(root).errors, []);
  });
});

test("reports a module that exits before the loader reports", () => {
  withFixture((root) => {
    writeFileSync(path.join(root, "dist/index.cjs"), "process.exit(0);\n");
    assert.match(
      inspectBuiltPackage(root).errors.join("\n"),
      /invalid CommonJS artifact dist\/index\.cjs \(the artifact loader printed no result\)/,
    );
  });
});

test("syntax-checks Bun-only exports instead of loading them in Node", () => {
  withFixture((root) => {
    addBunOnlyExport(root);
    const unlisted = inspectBuiltPackage(root, { bunOnlyExports: {} });
    const unlistedErrors = unlisted.errors.join("\n");
    assert.match(
      unlistedErrors,
      /invalid ESM artifact dist\/bun\.mjs \(import\(\) threw/,
    );
    assert.match(
      unlistedErrors,
      /invalid CommonJS artifact dist\/bun\.cjs \(require\(\) threw/,
    );

    const bunOnlyExports = { "@k-msg/fixture": ["./adapters/bun"] };
    const listed = inspectBuiltPackage(root, { bunOnlyExports });
    assert.deepEqual(listed.errors, []);
    assert.deepEqual(listed.syntaxOnly, ["dist/bun.mjs", "dist/bun.cjs"]);
    assert.deepEqual(listed.checkedEsm, ["dist/index.mjs"]);
    assert.deepEqual(listed.checkedCjs, ["dist/index.cjs"]);

    writeFileSync(path.join(root, "dist/bun.mjs"), "export { missing };\n");
    assert.match(
      inspectBuiltPackage(root, { bunOnlyExports }).errors.join("\n"),
      /invalid ESM artifact dist\/bun\.mjs \(SyntaxError: Export 'missing' is not defined/,
    );
  });
});

test("rejects Bun-only entries for subpaths the package does not export", () => {
  withFixture((root) => {
    const bunOnlyExports = { "@k-msg/fixture": ["./adapters/bun"] };
    assert.deepEqual(inspectBuiltPackage(root, { bunOnlyExports }).errors, [
      "@k-msg/fixture: Bun-only export ./adapters/bun is not in exports",
    ]);
  });
});

test("lists only Bun-only subpaths that workspace packages export", () => {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const manifests = new Map(
    listPublishablePackageDirs(repositoryRoot).map((packageDir) => {
      const manifest = JSON.parse(
        readFileSync(path.join(packageDir, "package.json"), "utf8"),
      );
      return [manifest.name, manifest];
    }),
  );
  for (const [name, subpaths] of Object.entries(BUN_ONLY_EXPORTS)) {
    for (const subpath of subpaths) {
      assert.ok(
        manifests.get(name)?.exports?.[subpath],
        `${name} does not export ${subpath}`,
      );
    }
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
    assert.match(errors, /packed artifact is missing.*dist\/index\.cjs/);
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
          { path: "dist/index.cjs" },
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
