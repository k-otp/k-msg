import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { repoRoot, resolveWorkspaceTsgoBinary } from "./ttsc-graph-command";

type EntryBoundary = {
  entry: string;
  // Source folders, relative to the entry's package `src`, that the entry
  // must not reach.
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

// Repository source, wherever it lives: a path that leaves the package
// through an app, example, or script and comes back is still followed.
function isRepoSource(file: string): boolean {
  return (
    !file.startsWith("..") &&
    !file.includes(":") &&
    !file.split("/").includes("node_modules")
  );
}

function toRepoPath(file: string): string {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

async function isFile(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/**
 * Every file the compiler loads for a program rooted at `roots`, under the
 * root tsconfig: its `paths` resolve workspace packages (the entry's own
 * included) to source, and `allowJs` follows JavaScript and its JSDoc types.
 * That covers static, side-effect, dynamic, type-only, and triple-slash
 * references.
 */
async function listProgramFiles(roots: readonly string[]): Promise<string[]> {
  const directory = await mkdtemp(path.join(tmpdir(), "k-msg-entry-"));
  try {
    const project = path.join(directory, "tsconfig.json");
    await writeFile(
      project,
      JSON.stringify({
        extends: path.join(repoRoot, "tsconfig.json"),
        compilerOptions: { noEmit: true, plugins: [] },
        files: roots.map((root) => path.join(repoRoot, root)),
        include: [],
      }),
    );
    const child = Bun.spawn(
      [resolveWorkspaceTsgoBinary(), "--listFilesOnly", "-p", project],
      { cwd: repoRoot, stderr: "pipe", stdout: "pipe" },
    );
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    if (exitCode !== 0) {
      throw new Error(
        `tsc --listFilesOnly failed for ${roots.join(", ")}:\n${stdout}${stderr}`,
      );
    }
    return stdout
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .map((line) => toRepoPath(path.resolve(repoRoot, line)))
      .filter(isRepoSource);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

const loaders = {
  ".cjs": "js",
  ".cts": "ts",
  ".js": "js",
  ".jsx": "jsx",
  ".mjs": "js",
  ".mts": "ts",
  ".ts": "ts",
  ".tsx": "tsx",
} as const;
const transpilers = new Map(
  [...new Set(Object.values(loaders))].map((loader) => [
    loader,
    new Bun.Transpiler({ loader }),
  ]),
);
// Bun's own resolver, which honors the root tsconfig `paths` (workspace
// packages resolve to source) and picks among extensions as Bun does.
function resolveRuntimeTarget(from: string, specifier: string): string | null {
  let resolved: string;
  try {
    resolved = Bun.resolveSync(
      specifier,
      path.dirname(path.join(repoRoot, from)),
    );
  } catch (error) {
    if (specifier.startsWith(".")) {
      throw new Error(`Cannot resolve ${specifier} from ${from}: ${error}`);
    }
    return null;
  }
  if (!path.isAbsolute(resolved)) return null;
  const file = toRepoPath(resolved);
  return isRepoSource(file) ? file : null;
}

// Declaration overlays and the JavaScript they stand in for at run time.
const declarationOverlays = [
  [".d.ts", [".js", ".mjs", ".cjs"]],
  [".d.mts", [".mjs"]],
  [".d.cts", [".cjs"]],
] as const;

// What runs but the compiler may not load: a literal `require()`, and the
// JavaScript behind a declaration file.
async function runtimeDependencies(file: string): Promise<string[]> {
  for (const [suffix, runtime] of declarationOverlays) {
    if (!file.endsWith(suffix)) continue;
    const stem = file.slice(0, -suffix.length);
    const found: string[] = [];
    for (const extension of runtime) {
      if (await isFile(path.join(repoRoot, `${stem}${extension}`))) {
        found.push(`${stem}${extension}`);
      }
    }
    return found;
  }
  const loader = loaders[path.extname(file) as keyof typeof loaders];
  const transpiler = loader ? transpilers.get(loader) : undefined;
  if (!transpiler) return [];
  const source = await readFile(path.join(repoRoot, file), "utf8");
  const targets: string[] = [];
  for (const { path: specifier } of transpiler.scanImports(source)) {
    const target = resolveRuntimeTarget(file, specifier);
    if (target) targets.push(target);
  }
  return targets;
}

/**
 * The files an entry reaches: the compiler's program, plus what Bun's
 * parser finds at run time in those files, repeated until nothing new
 * appears. Not followed: a specifier computed at run time, as bundlers cannot
 * follow it either, and URL-based loads such as `new URL("./x", import.meta.url)`.
 */
async function collectEntryClosure(entry: string): Promise<string[]> {
  const roots = new Set([entry]);
  const scanned = new Set<string>();
  const closure = new Set<string>();
  for (;;) {
    for (const file of await listProgramFiles([...roots])) closure.add(file);
    let grew = false;
    for (const file of [...closure]) {
      if (scanned.has(file) || !isRepoSource(file)) continue;
      scanned.add(file);
      for (const target of await runtimeDependencies(file)) {
        if (closure.has(target)) continue;
        closure.add(target);
        // Assets such as CSS stay leaves: tsc rejects them as roots.
        if (path.extname(target) in loaders) {
          roots.add(target);
          grew = true;
        }
      }
    }
    if (!grew) return [...closure].sort();
  }
}

async function checkBoundary(boundary: EntryBoundary): Promise<string[]> {
  const match = /^(packages\/[^/]+)\/src\/.+\.tsx?$/.exec(boundary.entry);
  if (!match?.[1] || !(await isFile(path.join(repoRoot, boundary.entry)))) {
    throw new Error(
      `Entry boundary ${boundary.entry} must be an existing packages/<name>/src/**/*.ts file.`,
    );
  }
  const sourceRoot = `${match[1]}/src/`;
  const closure = await collectEntryClosure(boundary.entry);
  if (!closure.includes(boundary.entry)) {
    throw new Error(`The compiler did not load ${boundary.entry}.`);
  }
  return closure.flatMap((file) => {
    if (!file.startsWith(sourceRoot)) return [];
    const folder = file.slice(sourceRoot.length).split("/")[0];
    return folder && boundary.forbidden.includes(folder)
      ? [`${boundary.entry} reaches ${file}: ${boundary.reason}.`]
      : [];
  });
}

/** Fails when an entry reaches a folder its boundary forbids. */
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
