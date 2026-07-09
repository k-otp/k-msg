import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type PackageMeta = {
  dir: string;
  name: string;
};

type PackageJson = {
  exports?: Record<string, unknown> | string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const docsDir = path.join(repoRoot, "apps/docs");
const outputPath = path.join(docsDir, "typedoc.entrypoints.json");
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

async function collectEntryPoints(): Promise<string[]> {
  const entries = new Set<string>();

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

    for (const [, exportValue] of exportEntries) {
      const selectedPath = pickExportPath(exportValue);
      if (!selectedPath) {
        continue;
      }

      const tsPath = toTypeScriptSource(selectedPath);
      const absoluteTsPath = path.join(repoRoot, pkg.dir, tsPath);
      const relativeToDocs = path
        .relative(docsDir, absoluteTsPath)
        .replaceAll(path.sep, "/");

      entries.add(
        relativeToDocs.startsWith(".") ? relativeToDocs : `./${relativeToDocs}`,
      );
    }
  }

  return Array.from(entries).sort();
}

async function main(): Promise<void> {
  const next = `${JSON.stringify(await collectEntryPoints(), null, 2)}\n`;

  let current = "";
  try {
    current = await readFile(outputPath, "utf8");
  } catch {
    current = "";
  }

  if (checkMode) {
    if (current !== next) {
      console.error(`typedoc entrypoints out of date: ${outputPath}`);
      process.exit(1);
    }
    console.log(`ok: ${outputPath}`);
    return;
  }

  if (current === next) {
    console.log(`unchanged: ${outputPath}`);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, next, "utf8");
  console.log(`generated: ${outputPath}`);
}

await main();
