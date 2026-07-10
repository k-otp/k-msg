import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dir, "../..");

function resolveGraphBinary(): string {
  const requireFromRoot = createRequire(path.join(repoRoot, "package.json"));
  const manifestPath = requireFromRoot.resolve("@ttsc/graph/package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    bin?: Record<string, string> | string;
  };
  const binary =
    typeof manifest.bin === "string"
      ? manifest.bin
      : manifest.bin?.["ttsc-graph"];

  if (!binary) {
    throw new Error("@ttsc/graph does not declare the ttsc-graph binary.");
  }

  return path.resolve(path.dirname(manifestPath), binary);
}

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
  return Bun.spawn(["node", resolveGraphBinary(), ...withGraphDefaults(args)], {
    cwd: repoRoot,
    stderr,
    stdout,
  });
}
