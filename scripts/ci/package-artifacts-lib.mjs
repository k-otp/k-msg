import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const EXPORT_CONDITIONS = ["import", "require", "types"];

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

export function inspectBuiltPackage(packageDir, options = {}) {
  const nodeExecutable = options.nodeExecutable ?? process.execPath;
  const manifest = readJson(path.join(packageDir, "package.json"));
  const errors = [];
  const checkedEsm = [];
  validateLegacyEntryFields(manifest, errors);

  for (const artifact of collectPackageArtifactTargets(manifest)) {
    let relativeTarget;
    try {
      relativeTarget = normalizePackageTarget(artifact.target);
    } catch (error) {
      errors.push(`${manifest.name}: ${error.message}`);
      continue;
    }

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

    if (artifact.condition !== "import") continue;
    // Project packages reserve .mjs for import and .js for the separately
    // built CommonJS require condition, even though their type is module.
    if (path.extname(relativeTarget) !== ".mjs") {
      errors.push(
        `${manifest.name}: ESM export must use .mjs: ${relativeTarget}`,
      );
      continue;
    }

    const result = spawnSync(nodeExecutable, ["--check", absoluteTarget], {
      encoding: "utf8",
      timeout: 30_000,
    });
    if (result.status !== 0) {
      const detail =
        result.error?.message ||
        (result.stderr || result.stdout).trim().split("\n")[0] ||
        (result.signal ? `terminated by ${result.signal}` : "");
      errors.push(
        `${manifest.name}: invalid ESM artifact ${relativeTarget}${detail ? ` (${detail})` : ""}`,
      );
      continue;
    }
    checkedEsm.push(relativeTarget);
  }

  return { checkedEsm: [...new Set(checkedEsm)], errors, manifest };
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
