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

function isHelpRequest(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

function isVersionRequest(argv: string[]): boolean {
  return argv.includes("--version") || argv.includes("-v");
}

function isSupportedCompletionShell(
  value: string,
): value is (typeof SHELL_NAMES)[number] {
  return SHELL_NAMES.includes(value as (typeof SHELL_NAMES)[number]);
}

function isCompletionProtocolArgv(argv: string[]): boolean {
  return argv[0] === "complete" && argv.includes("--");
}

function validateCompletionShellArg(argv: string[]): string | undefined {
  const shell = argv[1];
  if (
    shell === undefined ||
    shell === "--" ||
    shell === "--help" ||
    shell === "-h" ||
    shell === "--version" ||
    shell === "-v"
  ) {
    return undefined;
  }

  return isSupportedCompletionShell(shell)
    ? undefined
    : `Unsupported completion shell: ${shell} (supported: ${SHELL_NAMES.join(", ")})`;
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

function printCompletionCommandHelp(command: "complete" | "completions"): void {
  if (command === "completions") {
    console.log(
      [
        "Generate shell completion scripts",
        "",
        "Usage:",
        "  k-msg completions <shell>",
        "",
        "Arguments:",
        `  <shell>             One of: ${SHELL_NAMES.join(", ")}`,
        "",
        "Built-ins:",
        "  -h, --help          Show help",
        "  -v, --version       Show version",
      ].join("\n"),
    );
    return;
  }

  console.log(
    [
      "Completion protocol callback for shell integration",
      "",
      "Usage:",
      "  k-msg complete -- <words...>",
      "",
      "Notes:",
      "  This command is used by generated shell completion scripts.",
      "  Everything after `--` is treated as completion input.",
      "",
      "Built-ins:",
      "  -h, --help          Show help",
      "  -v, --version       Show version",
    ].join("\n"),
  );
}

function appendAliasName(names: string, alias: string): string {
  const tokens = names
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  if (tokens.includes(alias)) {
    return tokens.join(" ");
  }
  return [...tokens, alias].join(" ");
}

function patchCompletionScriptForAliases(
  argv: string[],
): { postlude?: string; prelude?: string } {
  const command = argv[0];
  if (command !== "completions") {
    return {};
  }

  const shell = argv[1];
  if (shell === "bash") {
    return { postlude: "complete -F __k_msg_complete kmsg\n" };
  }

  if (shell === "zsh") {
    return {
      prelude: `#compdef ${appendAliasName("k-msg", "kmsg")}\n`,
      postlude: "compdef _k-msg kmsg\n",
    };
  }

  return {};
}

function normalizeCompletionContext(words: string[]): {
  blocked: boolean;
  current: string;
  path: string[];
} {
  const current = words.at(-1) ?? "";
  const rawPath = words.length > 0 ? words.slice(0, -1) : [];
  const path: string[] = [];

  for (let index = 0; index < rawPath.length; index += 1) {
    const token = rawPath[index];
    if (!token) {
      continue;
    }

    if (path.length > 0 || !token.startsWith("-")) {
      path.push(...rawPath.slice(index));
      break;
    }

    if (token === "--config") {
      const value = rawPath[index + 1];
      if (value === undefined) {
        return { blocked: true, current, path: [] };
      }
      index += 1;
      continue;
    }

    if (token.startsWith("--config=")) {
      continue;
    }

    path.push(...rawPath.slice(index));
    break;
  }

  return { blocked: false, current, path };
}

function resolveCompletionEntries(words: string[]): CompletionEntry[] {
  const { blocked, current, path } = normalizeCompletionContext(words);
  if (blocked) {
    return [];
  }

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

  const command = argv[0];
  if (command === "complete" || command === "completions") {
    if (isVersionRequest(argv)) {
      console.log(
        `k-msg v${
          typeof packageJson.version === "string"
            ? packageJson.version
            : "0.0.0"
        }`,
      );
      return;
    }
    if (isHelpRequest(argv)) {
      printCompletionCommandHelp(command);
      return;
    }
  }

  const shellValidationError = validateCompletionShellArg(argv);
  if (shellValidationError) {
    console.error(shellValidationError);
    process.exitCode = 2;
    return;
  }

  const { prelude, postlude } = patchCompletionScriptForAliases(argv);
  if (prelude) {
    process.stdout.write(prelude);
  }

  await cli(normalizeCompletionArgv(argv), completionCommand, {
    fallbackToEntry: true,
    name: "k-msg",
    plugins: [completion()],
    usageSilent: true,
    version:
      typeof packageJson.version === "string" ? packageJson.version : "0.0.0",
  });

  if (postlude) {
    process.stdout.write(postlude);
  }
}
