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

const codeExtension = /\.(?:[cm]?[jt]sx?)$/;

/**
 * Every file Bun parses while bundling `entry`, recorded as it loads them and
 * so before tree shaking can drop a side-effect import: Bun's own resolution
 * (the root tsconfig `paths`, `foo.tsx` before `foo.ts`, the JavaScript
 * behind a `.d.ts`), literal `require()`, and dynamic `import()` with a
 * literal specifier, while a call to a shadowed `require` stays local.
 */
async function bundleInputs(entry: string): Promise<string[]> {
  const loaded = new Set<string>();
  const result = await Bun.build({
    entrypoints: [path.join(repoRoot, entry)],
    plugins: [
      {
        name: "record-loaded-files",
        setup(build) {
          build.onLoad({ filter: /.*/ }, (args) => {
            loaded.add(toRepoPath(args.path));
            return undefined;
          });
        },
      },
    ],
    target: "bun",
    throw: false,
  });
  if (!result.success) {
    throw new Error(
      `Bun could not bundle ${entry}:\n${result.logs.map(String).join("\n")}`,
    );
  }
  return [...loaded].filter(isRepoSource);
}

// Every real `import.meta` becomes this identifier, which no string or
// comment can contain, so only actual uses are inspected.
const metaSentinel = `__entry_boundary_meta_${crypto.randomUUID().replaceAll("-", "")}`;
const transpilerOptions = { define: { "import.meta": metaSentinel } };
const transpilers = {
  js: new Bun.Transpiler({ ...transpilerOptions, loader: "js" }),
  jsx: new Bun.Transpiler({ ...transpilerOptions, loader: "jsx" }),
  ts: new Bun.Transpiler({ ...transpilerOptions, loader: "ts" }),
  tsx: new Bun.Transpiler({ ...transpilerOptions, loader: "tsx" }),
};
// `import.meta` properties that describe the module or read the environment
// without loading one.
const safeMetaUse = new RegExp(
  `${metaSentinel}\\.(?:dir|dirname|env|file|filename|main|path|resolve|url)\\b`,
  "g",
);

function transpilerFor(file: string): Bun.Transpiler | undefined {
  if (/\.d\.[cm]?ts$/.test(file)) return undefined;
  if (/\.[cm]?ts$/.test(file)) return transpilers.ts;
  if (file.endsWith(".tsx")) return transpilers.tsx;
  if (/\.[cm]?js$/.test(file)) return transpilers.js;
  if (file.endsWith(".jsx")) return transpilers.jsx;
  return undefined;
}

// Any other `import.meta` use, such as `import.meta.require()` in any
// spelling, and the `module` builtin (`createRequire`) build loaders that
// neither Bun's bundler nor the compiler follows, so the gate cannot see what
// they reach. Reachable files must use `import` instead. Code evaluation
// (`eval`, `new Function`, a loader reached through an aliased
// `process.getBuiltinModule`) is out of scope: no static check can follow it.
async function findUntrackedLoads(files: readonly string[]): Promise<string[]> {
  const offenders: string[] = [];
  for (const file of files) {
    const transpiler = transpilerFor(file);
    if (!transpiler) continue;
    const source = await readFile(path.join(repoRoot, file), "utf8");
    const output = transpiler.transformSync(source).replace(safeMetaUse, "");
    const importsModuleApi = transpiler
      .scan(source)
      .imports.some(({ path: specifier }) =>
        /^(?:node:)?module$/.test(specifier),
      );
    if (output.includes(metaSentinel) || importsModuleApi) offenders.push(file);
  }
  return offenders;
}

/**
 * The files an entry reaches: what Bun bundles for it, and every file the
 * compiler loads from the entry and those bundled files, which adds
 * type-only and side-effect references that bundling erases or shakes out.
 * Not followed: a specifier computed at run time, and URL-based loads such as
 * `new URL("./x", import.meta.url)`; any other `import.meta` use, such as
 * `import.meta.require()`, is rejected.
 */
async function collectEntryClosure(entry: string): Promise<string[]> {
  const bundled = await bundleInputs(entry);
  const roots = [
    entry,
    ...bundled.filter((file) => file !== entry && codeExtension.test(file)),
  ];
  const listed = await listProgramFiles(roots);
  return [...new Set([...bundled, ...listed])].sort();
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
  const untracked = (await findUntrackedLoads(closure)).map(
    (file) =>
      `${boundary.entry} reaches ${file}, which builds its own module loader (import.meta.require or the module builtin's createRequire); use import so the boundary can be checked.`,
  );
  return untracked.concat(
    closure.flatMap((file) => {
      if (!file.startsWith(sourceRoot)) return [];
      const folder = file.slice(sourceRoot.length).split("/")[0];
      return folder && boundary.forbidden.includes(folder)
        ? [`${boundary.entry} reaches ${file}: ${boundary.reason}.`]
        : [];
    }),
  );
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
