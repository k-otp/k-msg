import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./ttsc-graph-command";

type EntryBoundary = {
  entry: string;
  // Source folders, relative to the entry's package `src`, that the entry
  // must not reach through relative imports, type-only imports included.
  forbidden: readonly string[];
  reason: string;
};

// `@k-msg/messaging` keeps tracking, queues, and runtime storage behind
// subpaths so a send-only consumer never loads them. These rules keep the
// root entry that small, and keep storage adapters out of the portable
// subpaths that the adapters themselves build on.
const entryBoundaries: readonly EntryBoundary[] = [
  {
    entry: "packages/messaging/src/index.ts",
    forbidden: [
      "adapters",
      "delivery",
      "delivery-tracking",
      "migration",
      "queue",
      "sender",
      "tracking",
    ],
    reason:
      "the root entry is the send flow; tracking, queues, and storage live on subpaths",
  },
  ...["tracking", "queue", "sender"].map((subpath) => ({
    entry: `packages/messaging/src/${subpath}/index.ts`,
    forbidden: ["adapters", "migration"],
    reason: "runtime storage adapters build on this subpath, not the reverse",
  })),
];

const importSpecifier =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g;

async function isFile(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

function toPosix(file: string): string {
  return file.replaceAll("\\", "/");
}

async function resolveModule(base: string): Promise<string | null> {
  const stem = base.replace(/\.jsx?$/, "");
  for (const candidate of [
    base,
    `${stem}.ts`,
    `${stem}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

type PackageInfo = { name: string; sourceRoot: string };

// A package can import itself by name through its `exports` subpaths, which
// map `name` to `src/index.ts` and `name/sub` to `src/sub/index.ts` here.
function selfReferenceBase(specifier: string, pkg: PackageInfo): string | null {
  if (specifier === pkg.name) return pkg.sourceRoot;
  if (!specifier.startsWith(`${pkg.name}/`)) return null;
  return path.join(pkg.sourceRoot, specifier.slice(pkg.name.length + 1));
}

async function collectEntryClosure(
  entry: string,
  pkg: PackageInfo,
): Promise<string[]> {
  const seen = new Set<string>();
  const pending = [path.join(repoRoot, entry)];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(importSpecifier)) {
      const specifier = match[1];
      if (!specifier) continue;
      const base = specifier.startsWith(".")
        ? path.resolve(path.dirname(file), specifier)
        : selfReferenceBase(specifier, pkg);
      if (!base) continue;
      const resolved = await resolveModule(base);
      if (!resolved) {
        throw new Error(
          `Cannot resolve ${specifier} from ${toPosix(path.relative(repoRoot, file))}.`,
        );
      }
      pending.push(resolved);
    }
  }
  return [...seen].map((file) => toPosix(path.relative(repoRoot, file))).sort();
}

async function readPackageInfo(entry: string): Promise<PackageInfo> {
  const match = /^(packages\/[^/]+)\/src\/.+\.ts$/.exec(entry);
  if (!match?.[1]) {
    throw new Error(
      `Entry boundary ${entry} must be a packages/<name>/src/**/*.ts file.`,
    );
  }
  const packageRoot = path.join(repoRoot, match[1]);
  if (!(await isFile(path.join(repoRoot, entry)))) {
    throw new Error(`Entry boundary ${entry} does not exist.`);
  }
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  ) as { name?: unknown };
  if (typeof manifest.name !== "string") {
    throw new Error(`${match[1]}/package.json has no name.`);
  }
  return { name: manifest.name, sourceRoot: path.join(packageRoot, "src") };
}

async function checkBoundary(boundary: EntryBoundary): Promise<string[]> {
  const pkg = await readPackageInfo(boundary.entry);
  const sourceRoot = `${toPosix(path.relative(repoRoot, pkg.sourceRoot))}/`;
  const closure = await collectEntryClosure(boundary.entry, pkg);
  return closure.flatMap((file) => {
    if (!file.startsWith(sourceRoot)) return [];
    const folder = file.slice(sourceRoot.length).split("/")[0];
    return folder && boundary.forbidden.includes(folder)
      ? [`${boundary.entry} reaches ${file}: ${boundary.reason}.`]
      : [];
  });
}

export async function validateEntryBoundaries(): Promise<void> {
  const violations = (
    await Promise.all(entryBoundaries.map(checkBoundary))
  ).flat();
  if (violations.length > 0) {
    throw new Error(
      `Package entry boundaries violated:\n${violations.join("\n")}`,
    );
  }
}
