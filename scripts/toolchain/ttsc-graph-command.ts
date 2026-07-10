import path from "node:path";

export const repoRoot = path.resolve(import.meta.dir, "../..");
const graphBinary = path.join(
  repoRoot,
  "node_modules",
  "@ttsc",
  "graph",
  "lib",
  "bin.js",
);

type RunGraphOptions = {
  stderr?: "inherit" | "pipe";
  stdout?: "inherit" | "pipe";
};

export function withGraphDefaults(args: readonly string[]): string[] {
  const finalArgs = [...args];
  const hasCwd = finalArgs.some(
    (argument) => argument === "--cwd" || argument.startsWith("--cwd="),
  );
  const hasTsconfig = finalArgs.some(
    (argument) =>
      argument === "--tsconfig" ||
      argument.startsWith("--tsconfig=") ||
      argument === "-p",
  );

  if (!hasCwd) {
    finalArgs.push("--cwd", repoRoot);
  }
  if (!hasTsconfig) {
    finalArgs.push("--tsconfig", "tsconfig.graph.json");
  }

  return finalArgs;
}

export function runGraph(
  args: readonly string[],
  { stderr = "inherit", stdout = "inherit" }: RunGraphOptions = {},
) {
  return Bun.spawn(["node", graphBinary, ...withGraphDefaults(args)], {
    cwd: repoRoot,
    stderr,
    stdout,
  });
}
