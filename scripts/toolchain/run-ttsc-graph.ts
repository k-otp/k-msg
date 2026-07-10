import { repoRoot, runGraph } from "./ttsc-graph-command";

function printHelp(): void {
  console.log(`Usage: bun run graph:ttsc -- [subcommand] [options]

Runs @ttsc/graph against the workspace TypeScript 7 program.

Examples:
  bun run graph:ttsc
  bun run graph:ttsc -- dump > /tmp/k-msg.graph.json
  bun run graph:ttsc -- view --tsconfig packages/provider/tsconfig.json

Without a subcommand, the process serves MCP over stdio.
The project root defaults to ${repoRoot}, using tsconfig.graph.json.`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const processHandle = runGraph(args);
process.exit(await processHandle.exited);
