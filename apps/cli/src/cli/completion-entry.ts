import completion from "@gunshi/plugin-completion";
import { cli, define } from "gunshi";
import packageJson from "../../package.json";
import {
  type CliCommandDefinition,
  type CliNode,
  type CliOptionDefinition,
  isCliCommand,
  isCliGroup,
} from "./command-contract";
import { runCommandDispatcher } from "./command-dispatcher";
import { listPublicRootCommands, listRootCommands } from "./command-registry";

type CompletionVersions = {
  bun?: string | undefined;
};

type CompletionEntry = {
  description: string;
  value: string;
};

const SHELL_NAMES = ["bash", "zsh", "fish", "powershell"] as const;
const SHELL_COMPLETION_ENTRIES = SHELL_NAMES.map((shell) => ({
  description: `Generate ${shell} completion script`,
  value: shell,
})) satisfies CompletionEntry[];

const completionCommand = define({
  description:
    typeof packageJson.description === "string"
      ? packageJson.description
      : "k-msg CLI",
  name: "k-msg",
  run: async (context) => {
    await runCommandDispatcher(context._);
  },
});

export function shouldUseCompletionBoundary(
  argv: string[],
  _versions: CompletionVersions = process.versions,
): boolean {
  const [command] = argv;
  return command === "complete" || command === "completions";
}

function normalizeCompletionArgv(argv: string[]): string[] {
  const [command, ...rest] = argv;
  return command === "completions" ? ["complete", ...rest] : argv;
}

function isCompletionProtocolArgv(argv: string[]): boolean {
  return argv[0] === "complete" && argv.includes("--");
}

function printCompletionProtocol(argv: string[]): void {
  const terminatorIndex = argv.indexOf("--");
  const words = argv.slice(terminatorIndex + 1);
  const entries = resolveCompletionEntries(words);

  for (const entry of entries) {
    console.log(
      entry.description.length > 0
        ? `${entry.value}\t${entry.description}`
        : entry.value,
    );
  }
  console.log(":4");
}

function resolveCompletionEntries(words: string[]): CompletionEntry[] {
  const current = words.at(-1) ?? "";
  const path = words.length > 0 ? words.slice(0, -1) : [];

  if (path[0] === "completions") {
    return filterCompletionEntries(SHELL_COMPLETION_ENTRIES, current);
  }

  const context = resolveCompletionContext(path);
  if (!context) {
    return [];
  }

  if (context.kind === "root") {
    return filterCompletionEntries(
      listPublicRootCommands().map((node) => ({
        description: node.description,
        value: node.name,
      })),
      current,
    );
  }

  if (isCliGroup(context.node)) {
    return filterCompletionEntries(
      context.node.commands.map((node) => ({
        description: node.description,
        value: node.name,
      })),
      current,
    );
  }

  return filterCompletionEntries(
    listCommandOptionEntries(context.node),
    current,
  );
}

function filterCompletionEntries(
  entries: CompletionEntry[],
  current: string,
): CompletionEntry[] {
  if (current.length === 0) {
    return entries;
  }
  return entries.filter((entry) => entry.value.startsWith(current));
}

function listCommandOptionEntries(
  command: CliCommandDefinition,
): CompletionEntry[] {
  return Object.entries(command.options).flatMap(([name, definition]) =>
    createOptionEntries(name, definition),
  );
}

function createOptionEntries(
  name: string,
  definition: CliOptionDefinition,
): CompletionEntry[] {
  const longValue =
    definition.argumentKind === "flag" ? `--${name}` : `--${name}`;
  const longDescription = definition.description ?? "";
  const entries: CompletionEntry[] = [
    { description: longDescription, value: longValue },
  ];

  if (definition.argumentKind === "flag") {
    entries.push({
      description: longDescription,
      value: `--no-${name}`,
    });
  }

  if (definition.short) {
    entries.push({
      description: longDescription,
      value: `-${definition.short}`,
    });
  }

  return entries;
}

function resolveCompletionContext(
  path: string[],
): { kind: "root" } | { kind: "node"; node: CliNode } | undefined {
  if (path.length === 0) {
    return { kind: "root" };
  }

  let currentNodes = listRootCommands();
  let currentNode: CliNode | undefined;

  for (const token of path) {
    if (token.startsWith("-")) {
      return currentNode && isCliCommand(currentNode)
        ? { kind: "node", node: currentNode }
        : undefined;
    }

    const nextNode = currentNodes.find((node) => node.name === token);
    if (!nextNode) {
      return undefined;
    }

    currentNode = nextNode;
    if (isCliGroup(nextNode)) {
      currentNodes = nextNode.commands;
      continue;
    }

    currentNodes = [];
  }

  return currentNode ? { kind: "node", node: currentNode } : { kind: "root" };
}

export async function runCliEntrypoint(
  argv = process.argv.slice(2),
): Promise<void> {
  if (!shouldUseCompletionBoundary(argv)) {
    await runCommandDispatcher(argv);
    return;
  }

  if (isCompletionProtocolArgv(argv)) {
    printCompletionProtocol(argv);
    return;
  }

  const rendered = await cli(normalizeCompletionArgv(argv), completionCommand, {
    fallbackToEntry: true,
    name: "k-msg",
    plugins: [completion()],
    usageSilent: true,
    version:
      typeof packageJson.version === "string" ? packageJson.version : "0.0.0",
  });
  if (typeof rendered === "string" && rendered.length > 0) {
    console.log(rendered);
  }
}
