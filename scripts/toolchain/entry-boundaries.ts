import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
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
      .filter((file) => !file.startsWith("..") && !file.includes(":"));
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
const runtimeExtensions = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
];

async function readWorkspaceSources(): Promise<Map<string, string>> {
  const sources = new Map<string, string>();
  for (const area of ["packages", "apps"]) {
    const areaRoot = path.join(repoRoot, area);
    for (const entry of await readdir(areaRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(areaRoot, entry.name, "package.json");
      if (!(await isFile(manifestPath))) continue;
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        name?: unknown;
      };
      if (typeof manifest.name === "string") {
        sources.set(manifest.name, path.join(areaRoot, entry.name, "src"));
      }
    }
  }
  return sources;
}

// The file a bundler or Bun loads for a specifier: the exact file when it
// exists (`./loader.js` next to `loader.d.ts` is the JavaScript), else the
// first source extension, else an index file. Workspace package names map
// to their `src`, as their `exports` subpaths do.
async function resolveRuntimeTarget(
  from: string,
  specifier: string,
  sources: Map<string, string>,
): Promise<string | null> {
  let base: string | null = null;
  if (specifier.startsWith(".")) {
    base = path.resolve(path.dirname(path.join(repoRoot, from)), specifier);
  } else {
    for (const [name, sourceRoot] of sources) {
      if (specifier === name) base = sourceRoot;
      else if (specifier.startsWith(`${name}/`)) {
        base = path.join(sourceRoot, specifier.slice(name.length + 1));
      }
      if (base) break;
    }
  }
  if (!base) return null;
  const stem = base.replace(/\.(?:[cm]?js|jsx)$/, "");
  const candidates = [
    base,
    ...runtimeExtensions.map((extension) => `${stem}${extension}`),
    ...runtimeExtensions.map((extension) =>
      path.join(base, `index${extension}`),
    ),
  ];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return toRepoPath(candidate);
  }
  if (specifier.startsWith(".")) {
    throw new Error(`Cannot resolve ${specifier} from ${from}.`);
  }
  return null;
}

// What runs but the compiler may not load: a literal `require()`, and the
// JavaScript behind a declaration file.
async function runtimeDependencies(
  file: string,
  sources: Map<string, string>,
): Promise<string[]> {
  if (file.endsWith(".d.ts")) {
    const stem = file.slice(0, -".d.ts".length);
    const found: string[] = [];
    for (const extension of [".js", ".mjs", ".cjs"]) {
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
    const target = await resolveRuntimeTarget(file, specifier, sources);
    if (target) targets.push(target);
  }
  return targets;
}

/**
 * The files an entry reaches: the compiler's program, plus what Bun's
 * parser finds at run time in those files, repeated until nothing new
 * appears. A specifier computed at run time stays invisible, as it does to
 * bundlers.
 */
async function collectEntryClosure(
  entry: string,
  sources: Map<string, string>,
): Promise<string[]> {
  const roots = new Set([entry]);
  const scanned = new Set<string>();
  const closure = new Set<string>();
  for (;;) {
    for (const file of await listProgramFiles([...roots])) closure.add(file);
    let grew = false;
    for (const file of [...closure]) {
      if (scanned.has(file) || !/^(?:apps|packages)\//.test(file)) continue;
      scanned.add(file);
      for (const target of await runtimeDependencies(file, sources)) {
        if (closure.has(target)) continue;
        closure.add(target);
        roots.add(target);
        grew = true;
      }
    }
    if (!grew) return [...closure].sort();
  }
}

async function checkBoundary(
  boundary: EntryBoundary,
  sources: Map<string, string>,
): Promise<string[]> {
  const match = /^(packages\/[^/]+)\/src\/.+\.tsx?$/.exec(boundary.entry);
  if (!match?.[1] || !(await isFile(path.join(repoRoot, boundary.entry)))) {
    throw new Error(
      `Entry boundary ${boundary.entry} must be an existing packages/<name>/src/**/*.ts file.`,
    );
  }
  const sourceRoot = `${match[1]}/src/`;
  const closure = await collectEntryClosure(boundary.entry, sources);
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
  const sources = await readWorkspaceSources();
  const violations = (
    await Promise.all(
      entryBoundaries.map((boundary) => checkBoundary(boundary, sources)),
    )
  ).flat();
  if (violations.length > 0) {
    throw new Error(
      `Package entry boundaries violated:\n${violations.join("\n")}`,
    );
  }
}
