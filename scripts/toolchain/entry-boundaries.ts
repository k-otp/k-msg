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

async function resolveRelative(
  from: string,
  specifier: string,
): Promise<string | null> {
  const base = path.resolve(path.dirname(from), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
  ]) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

async function collectEntryClosure(entry: string): Promise<string[]> {
  const seen = new Set<string>();
  const pending = [path.join(repoRoot, entry)];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(importSpecifier)) {
      const specifier = match[1];
      if (!specifier?.startsWith(".")) continue;
      const resolved = await resolveRelative(file, specifier);
      if (!resolved) {
        throw new Error(
          `Cannot resolve ${specifier} from ${path.relative(repoRoot, file)}.`,
        );
      }
      pending.push(resolved);
    }
  }
  return [...seen].map((file) => path.relative(repoRoot, file)).sort();
}

export async function validateEntryBoundaries(): Promise<void> {
  const violations: string[] = [];
  for (const boundary of entryBoundaries) {
    const sourceRoot = boundary.entry.slice(
      0,
      boundary.entry.indexOf("/src/") + "/src/".length,
    );
    const closure = await collectEntryClosure(boundary.entry);
    for (const file of closure) {
      const folder = file.slice(sourceRoot.length).split("/")[0];
      if (folder && boundary.forbidden.includes(folder)) {
        violations.push(
          `${boundary.entry} reaches ${file}: ${boundary.reason}.`,
        );
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `Package entry boundaries violated:\n${violations.join("\n")}`,
    );
  }
}
