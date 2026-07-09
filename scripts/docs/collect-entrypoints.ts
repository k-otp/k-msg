import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type PackageMeta = {
  dir: string;
  name: string;
};

type ApiSourceEntry = {
  docsRelativePath: string;
  exportKey: string;
  packageDir: string;
  packageName: string;
  repoRelativePath: string;
};

type PackageJson = {
  exports?: Record<string, unknown> | string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsDir = path.join(repoRoot, "apps/docs");
const inventoryPath = path.join(docsDir, "api-sources.json");
const typedocOutputPath = path.join(docsDir, "typedoc.entrypoints.json");
const checkMode = process.argv.includes("--check");

const targetPackages: PackageMeta[] = [
  { dir: "packages/core", name: "@k-msg/core" },
  { dir: "packages/provider", name: "@k-msg/provider" },
  { dir: "packages/messaging", name: "@k-msg/messaging" },
  { dir: "packages/template", name: "@k-msg/template" },
  { dir: "packages/analytics", name: "@k-msg/analytics" },
  { dir: "packages/channel", name: "@k-msg/channel" },
  { dir: "packages/webhook", name: "@k-msg/webhook" },
  { dir: "packages/k-msg", name: "k-msg" },
];

function toTypeScriptSource(candidate: string): string {
  const withoutPrefix = candidate.replace(/^\.\//, "");
  const srcLike = withoutPrefix.replace(/^dist\//, "src/");

  if (srcLike.endsWith(".d.ts")) {
    return srcLike.replace(/\.d\.ts$/, ".ts");
  }
  if (
    srcLike.endsWith(".mjs") ||
    srcLike.endsWith(".cjs") ||
    srcLike.endsWith(".js")
  ) {
    return srcLike.replace(/\.(mjs|cjs|js)$/, ".ts");
  }

  return srcLike;
}

function pickExportPath(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const preferredKeys = ["types", "import", "default", "require"];

  for (const key of preferredKeys) {
    const candidate = record[key];
    if (typeof candidate === "string") {
      return candidate;
    }
  }

  return null;
}

async function collectApiSources(): Promise<ApiSourceEntry[]> {
  const entries = new Map<string, ApiSourceEntry>();

  for (const pkg of targetPackages) {
    const packageJsonPath = path.join(repoRoot, pkg.dir, "package.json");
    const packageJsonRaw = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonRaw) as PackageJson;

    if (!packageJson.exports) {
      throw new Error(`${pkg.name}: missing exports in package.json`);
    }

    const exportEntries =
      typeof packageJson.exports === "string"
        ? [[".", packageJson.exports] as const]
        : Object.entries(packageJson.exports);

    for (const [exportKey, exportValue] of exportEntries) {
      const selectedPath = pickExportPath(exportValue);
      if (!selectedPath) {
        continue;
      }

      const tsPath = toTypeScriptSource(selectedPath);
      const absoluteTsPath = path.join(repoRoot, pkg.dir, tsPath);
      const relativeToDocs = path
        .relative(docsDir, absoluteTsPath)
        .replaceAll(path.sep, "/");
      const docsRelativePath = relativeToDocs.startsWith(".")
        ? relativeToDocs
        : `./${relativeToDocs}`;
      const repoRelativePath = path
        .relative(repoRoot, absoluteTsPath)
        .replaceAll(path.sep, "/");

      entries.set(`${pkg.name}:${exportKey}`, {
        docsRelativePath,
        exportKey,
        packageDir: pkg.dir,
        packageName: pkg.name,
        repoRelativePath,
      });
    }
  }

  return [...entries.values()].sort((a, b) =>
    `${a.packageName}:${a.exportKey}`.localeCompare(
      `${b.packageName}:${b.exportKey}`,
    ),
  );
}

async function readOptionalFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function main(): Promise<void> {
  const apiSources = await collectApiSources();
  const inventoryNext = `${JSON.stringify(apiSources, null, 2)}\n`;
  const typedocNext = `${JSON.stringify(
    [...new Set(apiSources.map((entry) => entry.docsRelativePath))].sort(),
    null,
    2,
  )}\n`;

  const currentInventory = await readOptionalFile(inventoryPath);
  const currentTypedoc = await readOptionalFile(typedocOutputPath);

  if (checkMode) {
    let stale = false;

    if (currentInventory !== inventoryNext) {
      console.error(`api sources out of date: ${inventoryPath}`);
      stale = true;
    }
    if (currentTypedoc !== typedocNext) {
      console.error(`typedoc entrypoints out of date: ${typedocOutputPath}`);
      stale = true;
    }
    if (stale) {
      process.exit(1);
    }
    console.log(`ok: ${inventoryPath}`);
    console.log(`ok: ${typedocOutputPath}`);
    return;
  }

  if (currentInventory === inventoryNext && currentTypedoc === typedocNext) {
    console.log(`unchanged: ${inventoryPath}`);
    console.log(`unchanged: ${typedocOutputPath}`);
    return;
  }

  await mkdir(path.dirname(inventoryPath), { recursive: true });
  await writeFile(inventoryPath, inventoryNext, "utf8");
  await writeFile(typedocOutputPath, typedocNext, "utf8");
  console.log(`generated: ${inventoryPath}`);
  console.log(`generated: ${typedocOutputPath}`);
}

await main();
