import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./ttsc-graph-command";

type EntryBoundary = {
  entry: string;
  // Source folders, relative to the entry's package `src`, that the entry
  // must not reach, through runtime or type-only dependencies.
  forbidden: readonly string[];
  reason: string;
};

// The part of the compiler graph this check reads: which file declares each
// symbol, and which symbols use, reference, or re-export which.
export type EntryBoundaryGraph = {
  edges: readonly { from: string; to: string }[];
  nodes: readonly { file: string; id: string }[];
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

const transpilers = {
  ts: new Bun.Transpiler({ loader: "ts" }),
  tsx: new Bun.Transpiler({ loader: "tsx" }),
};

function toPosix(file: string): string {
  return file.replaceAll("\\", "/");
}

async function isFile(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
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

// Type-level dependencies, including type-only imports and re-exports, as
// the compiler resolved them: file A depends on file B when a symbol in A
// uses, references, or re-exports one declared in B.
function graphFileDependencies(
  graph: EntryBoundaryGraph,
): Map<string, Set<string>> {
  const fileById = new Map(graph.nodes.map((node) => [node.id, node.file]));
  const dependencies = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    const from = fileById.get(edge.from);
    const to = fileById.get(edge.to);
    if (!from || !to || from === to) continue;
    const targets = dependencies.get(from) ?? new Set<string>();
    targets.add(to);
    dependencies.set(from, targets);
  }
  return dependencies;
}

// Runtime imports, as Bun's parser reads them: static, side-effect, dynamic
// with a literal specifier, and `require`. Specifiers arrive decoded, and
// comments cannot hide them.
async function runtimeImports(
  file: string,
  pkg: PackageInfo,
): Promise<string[]> {
  if (!/\.tsx?$/.test(file)) return [];
  const transpiler = file.endsWith(".tsx") ? transpilers.tsx : transpilers.ts;
  const source = await readFile(path.join(repoRoot, file), "utf8");
  const resolved: string[] = [];
  for (const { path: specifier } of transpiler.scanImports(source)) {
    const base = specifier.startsWith(".")
      ? path.resolve(path.dirname(path.join(repoRoot, file)), specifier)
      : selfReferenceBase(specifier, pkg);
    if (!base) continue;
    const target = await resolveModule(base);
    if (!target) {
      throw new Error(`Cannot resolve ${specifier} from ${file}.`);
    }
    resolved.push(toPosix(path.relative(repoRoot, target)));
  }
  return resolved;
}

// Walks only the entry's own package: the graph gate already rejects package
// cycles, so a path through another package cannot lead back into this one.
async function collectEntryClosure(
  entry: string,
  pkg: PackageInfo,
  typeDependencies: Map<string, Set<string>>,
): Promise<string[]> {
  const sourceRoot = `${toPosix(path.relative(repoRoot, pkg.sourceRoot))}/`;
  const seen = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || seen.has(file) || !file.startsWith(sourceRoot)) continue;
    seen.add(file);
    pending.push(
      ...(typeDependencies.get(file) ?? []),
      ...(await runtimeImports(file, pkg)),
    );
  }
  return [...seen].sort();
}

async function readPackageInfo(entry: string): Promise<PackageInfo> {
  const match = /^(packages\/[^/]+)\/src\/.+\.tsx?$/.exec(entry);
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

async function checkBoundary(
  boundary: EntryBoundary,
  typeDependencies: Map<string, Set<string>>,
): Promise<string[]> {
  const pkg = await readPackageInfo(boundary.entry);
  const sourceRoot = `${toPosix(path.relative(repoRoot, pkg.sourceRoot))}/`;
  const closure = await collectEntryClosure(
    boundary.entry,
    pkg,
    typeDependencies,
  );
  return closure.flatMap((file) => {
    const folder = file.slice(sourceRoot.length).split("/")[0];
    return folder && boundary.forbidden.includes(folder)
      ? [`${boundary.entry} reaches ${file}: ${boundary.reason}.`]
      : [];
  });
}

/**
 * Fails when an entry reaches a forbidden folder through the compiler graph
 * (types, calls, re-exports) or a runtime import. An import whose specifier
 * is computed at run time is invisible to both, as it is to bundlers.
 */
export async function validateEntryBoundaries(
  graph: EntryBoundaryGraph,
): Promise<void> {
  const typeDependencies = graphFileDependencies(graph);
  const violations = (
    await Promise.all(
      entryBoundaries.map((boundary) =>
        checkBoundary(boundary, typeDependencies),
      ),
    )
  ).flat();
  if (violations.length > 0) {
    throw new Error(
      `Package entry boundaries violated:\n${violations.join("\n")}`,
    );
  }
}
