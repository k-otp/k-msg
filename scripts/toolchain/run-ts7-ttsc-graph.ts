import {
  ensureRunner,
  repoRoot,
  runnerRelativePath,
  spawnRunner,
} from "./ts7-runner";

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function printHelp(): void {
  console.log(`Usage: bun run graph:ttsc:ts7 -- [subcommand] [options]

Starts the isolated TS7/ttsc graph toolchain against this workspace.

Examples:
  bun run graph:ttsc:ts7
  bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json > /tmp/k-msg.graph.json
  bun run graph:ttsc:ts7 -- view --tsconfig packages/provider/tsconfig.json

When no subcommand is given, ttsc-graph serves its MCP transport on stdio.
The project root defaults to ${repoRoot}.
The cached runner lives in ${runnerRelativePath()}.`);
}

async function main(): Promise<void> {
  if (hasFlag("--help") || hasFlag("-h")) {
    printHelp();
    return;
  }

  const args = process.argv.slice(2);
  const hasProjectCwd =
    args.includes("--cwd") || args.some((arg) => arg.startsWith("--cwd="));
  const hasTsconfig =
    args.includes("--tsconfig") ||
    args.some((arg) => arg.startsWith("--tsconfig=")) ||
    args.includes("-p");

  const finalArgs = [...args];
  if (!hasProjectCwd) {
    finalArgs.push("--cwd", repoRoot);
  }
  if (!hasTsconfig) {
    finalArgs.push("--tsconfig", "tsconfig.json");
  }

  await ensureRunner({ withGraph: true });
  const proc = await spawnRunner("ttsc-graph", finalArgs);
  const exitCode = await proc.exited;
  process.exit(exitCode);
}

try {
  await main();
} catch (error) {
  console.error("\n[ttsc-graph-ts7] Fatal error:", error);
  process.exit(1);
}
