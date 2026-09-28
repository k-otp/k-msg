import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { repoRoot } from "./ttsc-graph-command";

type EntryBoundary = {
  entry: string;
  // Source folders, relative to the entry's package `src`, that the entry
  // must not reach, through runtime or type-level dependencies.
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

const loaders = {
  ".cjs": "js",
  ".js": "js",
  ".jsx": "jsx",
  ".mjs": "js",
  ".ts": "ts",
  ".tsx": "tsx",
} as const;
const transpilers = new Map(
  [...new Set(Object.values(loaders))].map((loader) => [
    loader,
    new Bun.Transpiler({ loader }),
  ]),
);

function toPosix(file: string): string {
  return file.replaceAll("\\", "/");
}

function toRepoPath(file: string): string {
  return toPosix(path.relative(repoRoot, file));
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

type Workspace = {
  // Package name to its absolute `src` directory.
  sources: Map<string, string>;
  typeDependencies: Map<string, Set<string>>;
};

async function readWorkspaceSources(): Promise<Map<string, string>> {
  const packagesRoot = path.join(repoRoot, "packages");
  const sources = new Map<string, string>();
  for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageRoot = path.join(packagesRoot, entry.name);
    const manifestPath = path.join(packageRoot, "package.json");
    if (!(await isFile(manifestPath))) continue;
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      name?: unknown;
    };
    if (typeof manifest.name === "string") {
      sources.set(manifest.name, path.join(packageRoot, "src"));
    }
  }
  return sources;
}

// Workspace packages import each other by name through their `exports`
// subpaths, which map `name` to `src/index.ts` and `name/sub` to
// `src/sub/index.ts` here.
function workspaceBase(
  specifier: string,
  sources: Map<string, string>,
): string | null {
  for (const [name, sourceRoot] of sources) {
    if (specifier === name) return sourceRoot;
    if (specifier.startsWith(`${name}/`)) {
      return path.join(sourceRoot, specifier.slice(name.length + 1));
    }
  }
  return null;
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
// with a literal specifier, and `require`, in TypeScript and JavaScript
// alike. Specifiers arrive decoded, and comments cannot hide them.
async function runtimeImports(
  file: string,
  workspace: Workspace,
): Promise<string[]> {
  const loader = loaders[path.extname(file) as keyof typeof loaders];
  const transpiler = loader ? transpilers.get(loader) : undefined;
  if (!transpiler) return [];
  const absolute = path.join(repoRoot, file);
  const source = await readFile(absolute, "utf8");
  const resolved: string[] = [];
  for (const { path: specifier } of transpiler.scanImports(source)) {
    const base = specifier.startsWith(".")
      ? path.resolve(path.dirname(absolute), specifier)
      : workspaceBase(specifier, workspace.sources);
    if (!base) continue;
    const target = await resolveModule(base);
    if (!target) {
      throw new Error(`Cannot resolve ${specifier} from ${file}.`);
    }
    resolved.push(toRepoPath(target));
  }
  return resolved;
}

// Walks every workspace package the entry reaches, so a path that leaves the
// package and comes back by name (`@k-msg/messaging/tracking`) is followed.
async function collectEntryClosure(
  entry: string,
  workspace: Workspace,
): Promise<string[]> {
  const seen = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || seen.has(file) || !file.startsWith("packages/")) continue;
    seen.add(file);
    pending.push(
      ...(workspace.typeDependencies.get(file) ?? []),
      ...(await runtimeImports(file, workspace)),
    );
  }
  return [...seen].sort();
}

async function checkBoundary(
  boundary: EntryBoundary,
  workspace: Workspace,
): Promise<string[]> {
  const match = /^(packages\/[^/]+)\/src\/.+\.tsx?$/.exec(boundary.entry);
  if (!match?.[1] || !(await isFile(path.join(repoRoot, boundary.entry)))) {
    throw new Error(
      `Entry boundary ${boundary.entry} must be an existing packages/<name>/src/**/*.ts file.`,
    );
  }
  const sourceRoot = `${match[1]}/src/`;
  const closure = await collectEntryClosure(boundary.entry, workspace);
  return closure.flatMap((file) => {
    if (!file.startsWith(sourceRoot)) return [];
    const folder = file.slice(sourceRoot.length).split("/")[0];
    return folder && boundary.forbidden.includes(folder)
      ? [`${boundary.entry} reaches ${file}: ${boundary.reason}.`]
      : [];
  });
}

/**
 * Fails when an entry reaches a forbidden folder through the compiler graph
 * (types, calls, re-exports) or a runtime import, across workspace packages.
 * Not followed: a specifier computed at run time, which bundlers cannot see
 * either, and a module reference that names no symbol, such as
 * `export type {} from "./x"`.
 */
export async function validateEntryBoundaries(
  graph: EntryBoundaryGraph,
): Promise<void> {
  const workspace: Workspace = {
    sources: await readWorkspaceSources(),
    typeDependencies: graphFileDependencies(graph),
  };
  const violations = (
    await Promise.all(
      entryBoundaries.map((boundary) => checkBoundary(boundary, workspace)),
    )
  ).flat();
  if (violations.length > 0) {
    throw new Error(
      `Package entry boundaries violated:\n${violations.join("\n")}`,
    );
  }
}
