import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPORT_CONDITIONS = ["import", "require", "types"];

// Packages keep "type": "module", so each runtime artifact carries its format
// in its extension. Node loads a CommonJS build named .js in such a package as
// ESM, and require() then throws "module is not defined in ES module scope".
const RUNTIME_FORMATS = {
  import: { extension: ".mjs", label: "ESM" },
  require: { extension: ".cjs", label: "CommonJS" },
};

// Export subpaths, by package name, whose modules import Bun built-ins such as
// bun:sqlite. Node cannot load them, so the gate only syntax-checks their
// runtime artifacts.
export const BUN_ONLY_EXPORTS = {
  "@k-msg/messaging": ["./adapters/bun"],
  "k-msg": ["./adapters/bun"],
};

// Runtime dependencies, by package name, that the package's artifacts still
// inline instead of importing. Each entry is a known defect, not an
// exemption: the consumer installs its own copy of the dependency, errors
// from the inlined copy fail instanceof against the consumer's classes, and
// the consumer's configuration of it, such as core's setGlobalLogger(), never
// reaches the inlined copy. Remove an entry once the package's build marks
// the dependency external; the gate rejects entries that no artifact inlines.
export const INLINED_DEPENDENCIES = {
  "@k-msg/analytics": ["@k-msg/core", "zod"],
  "@k-msg/channel": ["@k-msg/core", "zod"],
  "@k-msg/template": ["@k-msg/core", "zod"],
};

const RUNTIME_DEPENDENCY_FIELDS = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
];
// Bun ends each artifact with a comment naming its linked sourcemap.
const SOURCE_MAPPING_URL = /\/\/[#@] sourceMappingURL=(\S+)\s*$/;
// Sourcemap sources are URLs, so their separators are always "/".
const NODE_MODULES_PACKAGE = /(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/g;

const LOADER_SCRIPT = fileURLToPath(
  new URL("./load-package-artifact.mjs", import.meta.url),
);
const NODE_TIMEOUT_MS = 30_000;
// The gate checks what Node consumers see. Under Bun, for example when
// `bun test` runs from the repository root, process.execPath is Bun, whose
// module loader accepts artifacts that Node rejects.
const DEFAULT_NODE_EXECUTABLE = process.versions.bun
  ? "node"
  : process.execPath;

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function collectMatchedConditionTargets(value, condition) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((candidate) =>
      collectMatchedConditionTargets(candidate, condition),
    );
  }
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, candidate]) => {
    // A matched `types` branch may select declaration files by the nested
    // `import`/`require` conditions. Runtime branches must not treat nested
    // declaration targets as JavaScript entrypoints.
    if (
      condition !== "types" &&
      EXPORT_CONDITIONS.includes(key) &&
      key !== condition
    ) {
      return [];
    }
    return collectMatchedConditionTargets(candidate, condition);
  });
}

function collectNestedConditionTargets(value, condition) {
  if (Array.isArray(value)) {
    return value.flatMap((candidate) =>
      collectNestedConditionTargets(candidate, condition),
    );
  }
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, candidate]) =>
    key === condition
      ? collectMatchedConditionTargets(candidate, condition)
      : collectNestedConditionTargets(candidate, condition),
  );
}

function collectConditionTargets(value, condition) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((candidate) =>
      collectConditionTargets(candidate, condition),
    );
  }
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, candidate]) => {
    if (key === condition) {
      return collectMatchedConditionTargets(candidate, condition);
    }
    if (EXPORT_CONDITIONS.includes(key)) {
      // Type declarations may be nested under runtime conditions, for
      // example import.types and require.types. Runtime targets nested under
      // a types branch are declaration selectors and must remain excluded.
      return condition === "types"
        ? collectNestedConditionTargets(candidate, condition)
        : [];
    }
    return collectConditionTargets(candidate, condition);
  });
}

function exportEntries(exportsField) {
  if (
    typeof exportsField === "string" ||
    Array.isArray(exportsField) ||
    !exportsField ||
    typeof exportsField !== "object"
  ) {
    return [[".", exportsField]];
  }

  const entries = Object.entries(exportsField);
  if (entries.some(([key]) => key.startsWith("."))) return entries;
  return [[".", exportsField]];
}

export function collectPackageArtifactTargets(manifest) {
  const targets = [];

  for (const [subpath, descriptor] of exportEntries(manifest.exports)) {
    for (const condition of EXPORT_CONDITIONS) {
      for (const target of collectConditionTargets(descriptor, condition)) {
        targets.push({ condition, source: `exports[${subpath}]`, target });
      }
    }
  }

  for (const [field, condition] of [
    ["module", "import"],
    ["main", "require"],
    ["types", "types"],
  ]) {
    if (typeof manifest[field] === "string") {
      targets.push({ condition, source: field, target: manifest[field] });
    }
  }

  const seen = new Set();
  return targets.filter(({ condition, target }) => {
    const key = `${condition}\0${target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizePackageTarget(target) {
  if (typeof target !== "string" || target.length === 0) {
    throw new Error("artifact target must be a non-empty string");
  }

  const normalized = target.startsWith("./") ? target.slice(2) : target;
  if (
    path.isAbsolute(normalized) ||
    normalized === "" ||
    normalized.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`artifact target escapes the package: ${target}`);
  }
  return normalized;
}

function rootExportTargets(manifest, condition) {
  const root = exportEntries(manifest.exports).find(
    ([subpath]) => subpath === ".",
  );
  if (!root) return [];
  return collectConditionTargets(root[1], condition).map(
    normalizePackageTarget,
  );
}

function validateLegacyEntryFields(manifest, errors) {
  for (const [field, condition] of [
    ["module", "import"],
    ["main", "require"],
    ["types", "types"],
  ]) {
    if (typeof manifest[field] !== "string") continue;
    const target = normalizePackageTarget(manifest[field]);
    if (!rootExportTargets(manifest, condition).includes(target)) {
      errors.push(
        `${manifest.name}: ${field} (${manifest[field]}) disagrees with exports[.].${condition}`,
      );
    }
  }
}

function subpathRuntimeTargets(descriptor, condition) {
  const targets = new Set();
  for (const target of collectConditionTargets(descriptor, condition)) {
    try {
      targets.add(normalizePackageTarget(target));
    } catch {
      // inspectBuiltPackage reports invalid targets.
    }
  }
  return [...targets];
}

function collectBunOnlyTargets(manifest, subpaths, errors) {
  const descriptors = new Map(exportEntries(manifest.exports));
  const targets = new Set();
  for (const subpath of subpaths) {
    if (!descriptors.has(subpath)) {
      errors.push(
        `${manifest.name}: Bun-only export ${subpath} is not in exports`,
      );
      continue;
    }
    for (const condition of Object.keys(RUNTIME_FORMATS)) {
      for (const target of subpathRuntimeTargets(
        descriptors.get(subpath),
        condition,
      )) {
        targets.add(target);
      }
    }
  }
  return targets;
}

function listItems(items, limit, separator = ", ") {
  const shown = items.slice(0, limit).join(separator);
  return items.length > limit
    ? `${shown}${separator}and ${items.length - limit} more`
    : shown;
}

function runNode(nodeExecutable, args) {
  const result = spawnSync(nodeExecutable, args, {
    encoding: "utf8",
    timeout: NODE_TIMEOUT_MS,
  });
  if (result.status === 0) return { stdout: result.stdout };

  // Node prints the failing source line, which may be a whole minified
  // bundle, before the error itself.
  const lines = (result.stderr || result.stdout || "").trim().split("\n");
  const detail =
    result.error?.message ||
    lines.find((line) => /^(?:[A-Z]\w*)?Error\b/.test(line)) ||
    lines[0] ||
    (result.signal
      ? `terminated by ${result.signal}`
      : `exit code ${result.status}`);
  return { failure: detail };
}

function loadArtifact(nodeExecutable, condition, file) {
  const run = runNode(nodeExecutable, [LOADER_SCRIPT, condition, file]);
  if (run.failure) return { problems: [run.failure] };

  // The loader prints its result last, after anything the module printed.
  try {
    const result = JSON.parse(run.stdout.trim().split("\n").at(-1));
    if (typeof result?.error === "string") return { problems: [result.error] };
    if (Array.isArray(result?.exports) && Array.isArray(result.problems)) {
      return result;
    }
  } catch {
    // Reported below.
  }
  return { problems: ["the artifact loader printed no result"] };
}

function compareConditionExports(manifest, exportNames, errors) {
  for (const [subpath, descriptor] of exportEntries(manifest.exports)) {
    const [esmTargets, cjsTargets] = ["import", "require"].map((condition) =>
      subpathRuntimeTargets(descriptor, condition),
    );
    if (esmTargets.length !== 1 || cjsTargets.length !== 1) continue;

    const esm = exportNames.get(`import\0${esmTargets[0]}`);
    const cjs = exportNames.get(`require\0${cjsTargets[0]}`);
    if (!esm || !cjs) continue;

    for (const [condition, target, names, reference, referenceTarget] of [
      ["require", cjsTargets[0], cjs, esm, esmTargets[0]],
      ["import", esmTargets[0], esm, cjs, cjsTargets[0]],
    ]) {
      const missing = reference.filter((name) => !names.includes(name));
      if (missing.length > 0) {
        errors.push(
          `${manifest.name}: exports[${subpath}].${condition} (${target}) is missing ${listItems(missing, 5)} exported by ${referenceTarget}`,
        );
      }
    }
  }
}

// Bun 1.4.2 writes the sources of every sourcemap relative to the build's
// outdir, also for an entry it writes to a subdirectory of the outdir, while
// the Source Map spec resolves them relative to the map. For example,
// webhook's dist/toolkit/index.mjs.map listed ../../core/src/errors.ts, which
// the spec places at packages/webhook/core/src/errors.ts. Try the map's
// directory first, then each parent up to the package directory.
function resolveSource(source, mapFile, packageDir) {
  for (let base = path.dirname(mapFile); ; base = path.dirname(base)) {
    const candidate = path.resolve(base, source);
    if (existsSync(candidate)) return candidate;
    if (base === packageDir || path.dirname(base) === base) return undefined;
  }
}

function nearestPackageName(file) {
  for (
    let dir = path.dirname(file);
    path.dirname(dir) !== dir;
    dir = path.dirname(dir)
  ) {
    const manifestFile = path.join(dir, "package.json");
    if (!existsSync(manifestFile)) continue;
    const { name } = readJson(manifestFile);
    if (typeof name === "string") return name;
  }
  return undefined;
}

// Counts an artifact's modules by the package that owns them, from the
// sources of its linked sourcemap: an installed package by the path after the
// last node_modules segment, a workspace file by its nearest package.json.
export function countModulesByPackage(artifactFile, packageDir) {
  const url = readFileSync(artifactFile, "utf8").match(SOURCE_MAPPING_URL)?.[1];
  if (!url) return { problem: "it links no sourcemap" };
  const mapFile = path.resolve(path.dirname(artifactFile), url);
  let map;
  try {
    map = readJson(mapFile);
  } catch (error) {
    return { problem: `cannot read its sourcemap: ${error.message}` };
  }
  if (!Array.isArray(map?.sources)) {
    return { problem: `${path.basename(mapFile)} has no sources` };
  }

  const counts = new Map();
  for (const source of map.sources) {
    // Skip null sources, which mark generated code, and node: specifiers such
    // as node:buffer, which Bun lists for the polyfills of built-in modules
    // it inlines for its default browser target. No package owns either.
    if (typeof source !== "string" || source.startsWith("node:")) continue;
    let owner = [...source.matchAll(NODE_MODULES_PACKAGE)].at(-1)?.[1];
    if (!owner) {
      const file = resolveSource(source, mapFile, packageDir);
      if (!file) {
        return {
          problem: `its sourcemap lists ${source}, which does not exist`,
        };
      }
      owner = nearestPackageName(file);
    }
    counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  return { counts };
}

export function inspectBuiltPackage(packageDir, options = {}) {
  const nodeExecutable = options.nodeExecutable ?? DEFAULT_NODE_EXECUTABLE;
  const bunOnlyExports = options.bunOnlyExports ?? BUN_ONLY_EXPORTS;
  const inlinedDependencies =
    options.inlinedDependencies ?? INLINED_DEPENDENCIES;
  const manifest = readJson(path.join(packageDir, "package.json"));
  const errors = [];
  const checked = { import: [], require: [] };
  const syntaxOnly = [];
  const sourcemapChecked = [];
  const exportNames = new Map();
  const inspected = new Set();
  // npm installs these for the consumer, so an artifact that inlines one
  // ships a second copy of it.
  const runtimeDependencies = new Set(
    RUNTIME_DEPENDENCY_FIELDS.flatMap((field) =>
      Object.keys(manifest[field] ?? {}),
    ),
  );
  const knownInlined = new Set(inlinedDependencies[manifest.name] ?? []);
  const seenInlined = new Set();
  validateLegacyEntryFields(manifest, errors);
  const bunOnlyTargets = collectBunOnlyTargets(
    manifest,
    bunOnlyExports[manifest.name] ?? [],
    errors,
  );

  for (const artifact of collectPackageArtifactTargets(manifest)) {
    let relativeTarget;
    try {
      relativeTarget = normalizePackageTarget(artifact.target);
    } catch (error) {
      errors.push(`${manifest.name}: ${error.message}`);
      continue;
    }
    // main and module usually repeat an exports target without the ./ prefix.
    const inspectedKey = `${artifact.condition}\0${relativeTarget}`;
    if (inspected.has(inspectedKey)) continue;
    inspected.add(inspectedKey);

    const absoluteTarget = path.join(packageDir, relativeTarget);
    try {
      if (!statSync(absoluteTarget).isFile()) {
        errors.push(
          `${manifest.name}: artifact is not a file: ${relativeTarget}`,
        );
        continue;
      }
    } catch {
      errors.push(`${manifest.name}: artifact is missing: ${relativeTarget}`);
      continue;
    }

    const format = RUNTIME_FORMATS[artifact.condition];
    if (!format) continue;
    if (path.extname(relativeTarget) !== format.extension) {
      errors.push(
        `${manifest.name}: ${format.label} export must use ${format.extension}: ${relativeTarget}`,
      );
      continue;
    }

    if (runtimeDependencies.size > 0) {
      const modules = countModulesByPackage(
        absoluteTarget,
        path.resolve(packageDir),
      );
      if (modules.problem) {
        errors.push(
          `${manifest.name}: cannot tell which packages ${relativeTarget} inlines (${modules.problem})`,
        );
      } else {
        for (const [owner, count] of modules.counts) {
          if (owner === manifest.name || !runtimeDependencies.has(owner)) {
            continue;
          }
          if (knownInlined.has(owner)) {
            seenInlined.add(owner);
            continue;
          }
          errors.push(
            `${manifest.name}: ${relativeTarget} inlines ${count} ${count === 1 ? "module" : "modules"} of its dependency ${owner}; mark it external in the build so the artifact imports it`,
          );
        }
        sourcemapChecked.push(relativeTarget);
      }
    }

    const invalid = (detail) =>
      errors.push(
        `${manifest.name}: invalid ${format.label} artifact ${relativeTarget} (${detail})`,
      );

    if (bunOnlyTargets.has(relativeTarget)) {
      const run = runNode(nodeExecutable, ["--check", absoluteTarget]);
      if (run.failure) invalid(run.failure);
      else syntaxOnly.push(relativeTarget);
      continue;
    }

    const loaded = loadArtifact(
      nodeExecutable,
      artifact.condition,
      absoluteTarget,
    );
    if (loaded.problems.length > 0) {
      invalid(listItems(loaded.problems, 3, "; "));
      continue;
    }
    exportNames.set(inspectedKey, loaded.exports);
    checked[artifact.condition].push(relativeTarget);
  }

  compareConditionExports(manifest, exportNames, errors);
  for (const dependency of knownInlined) {
    if (!seenInlined.has(dependency)) {
      errors.push(
        `${manifest.name}: INLINED_DEPENDENCIES lists ${dependency}, but no artifact inlines it; remove the entry`,
      );
    }
  }

  return {
    checkedCjs: checked.require,
    checkedEsm: checked.import,
    errors,
    manifest,
    sourcemapChecked,
    syntaxOnly,
  };
}

export function inspectPackedPackage(packageDir, packResult) {
  const manifest = readJson(path.join(packageDir, "package.json"));
  const errors = [];
  const packedFiles = new Set(
    Array.isArray(packResult?.files)
      ? packResult.files.map((entry) => entry.path)
      : [],
  );

  if (!packedFiles.has("package.json")) {
    errors.push(`${manifest.name}: packed artifact is missing package.json`);
  }
  for (const file of packedFiles) {
    if (file.endsWith(".map")) {
      errors.push(`${manifest.name}: sourcemap must not be published: ${file}`);
    }
  }
  for (const artifact of collectPackageArtifactTargets(manifest)) {
    let relativeTarget;
    try {
      relativeTarget = normalizePackageTarget(artifact.target);
    } catch (error) {
      errors.push(`${manifest.name}: ${error.message}`);
      continue;
    }
    if (!packedFiles.has(relativeTarget)) {
      errors.push(
        `${manifest.name}: packed artifact is missing ${artifact.source}.${artifact.condition} target ${relativeTarget}`,
      );
    }
  }

  return { errors, manifest, packedFiles };
}

export function listPublishablePackageDirs(rootDir) {
  const packagesDir = path.join(rootDir, "packages");
  const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDir, entry.name))
    .filter((packageDir) => {
      const manifestFile = path.join(packageDir, "package.json");
      try {
        return readJson(manifestFile).private !== true;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(
          `unable to read package manifest ${manifestFile}: ${detail}`,
        );
      }
    })
    .sort();
  if (packageDirs.length === 0) {
    throw new Error(`no publishable packages found under ${packagesDir}`);
  }
  return packageDirs;
}
