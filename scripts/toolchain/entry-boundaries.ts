import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
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
 * Every file the compiler loads for a program rooted at `entry`, under the
 * root tsconfig: its `paths` resolve workspace packages (the entry's own
 * included) to source, and `allowJs` follows JavaScript and its JSDoc types.
 * That covers runtime, side-effect, dynamic, type-only, and triple-slash
 * references alike. A specifier computed at run time stays invisible, as it
 * does to bundlers.
 */
async function collectEntryClosure(entry: string): Promise<string[]> {
  const directory = await mkdtemp(path.join(tmpdir(), "k-msg-entry-"));
  try {
    const project = path.join(directory, "tsconfig.json");
    await writeFile(
      project,
      JSON.stringify({
        extends: path.join(repoRoot, "tsconfig.json"),
        compilerOptions: { noEmit: true, plugins: [] },
        files: [path.join(repoRoot, entry)],
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
        `tsc --listFilesOnly failed for ${entry}:\n${stdout}${stderr}`,
      );
    }
    return stdout
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .map((line) => toRepoPath(path.resolve(repoRoot, line)))
      .filter((file) => !file.startsWith("..") && !file.includes(":"))
      .sort();
  } finally {
    await rm(directory, { force: true, recursive: true });
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
