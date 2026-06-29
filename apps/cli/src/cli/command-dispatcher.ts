import packageJson from "../../package.json";
import {
  type CliCommandDefinition,
  type CliGroupDefinition,
  type CliNode,
  type CliOptionDefinition,
  type CliOptionsShape,
  type CliSpinnerFactory,
  type CliSpinnerHandle,
  type CliTerminal,
  isCliCommand,
  isCliGroup,
  type PromptApi,
} from "./command-contract";
import { listPublicRootCommands, listRootCommands } from "./command-registry";
import { optConfig } from "./options";
import { createReadlinePrompt } from "./prompt-runtime";
import { exitCodeForError, printError, shouldUseJsonOutput } from "./utils";

const CLI_NAME = "k-msg";
const CLI_VERSION =
  typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
const CLI_DESCRIPTION =
  typeof packageJson.description === "string"
    ? packageJson.description
    : "k-msg CLI";

type ResolutionResult = {
  command?: CliCommandDefinition;
  group?: CliGroupDefinition;
  path: string[];
  remaining: string[];
  unknownCommand?: string;
};

type ParsedCommandInput = {
  flags: Record<string, unknown>;
  helpRequested: boolean;
  positional: string[];
};

type GlobalCommandInput = {
  flags: {
    config?: string;
  };
  remaining: string[];
};

export async function runCommandDispatcher(
  argv = process.argv.slice(2),
): Promise<void> {
  let globalInput: GlobalCommandInput;
  try {
    globalInput = extractGlobalCommandInput(argv);
  } catch (error) {
    if (error instanceof CliUsageError) {
      console.error(error.message);
      process.exitCode = 2;
      return;
    }
    throw error;
  }
  const resolution = resolveCommandPath(
    globalInput.remaining,
    listRootCommands(),
  );
  if (resolution.unknownCommand) {
    console.error(`Unknown command: ${resolution.unknownCommand}`);
    process.exitCode = 2;
    return;
  }

  if (!resolution.command && !resolution.group) {
    if (requestsVersion(resolution.remaining)) {
      console.log(`${CLI_NAME} v${CLI_VERSION}`);
      return;
    }
    if (
      requestsHelp(resolution.remaining) ||
      resolution.remaining.length === 0
    ) {
      printHelp(undefined, []);
      return;
    }
    const [unknownOption] = resolution.remaining;
    if (unknownOption?.startsWith("-")) {
      console.error(`Unknown option: ${unknownOption}`);
      process.exitCode = 2;
      return;
    }
    printHelp(undefined, []);
    return;
  }

  if (resolution.group && !resolution.command) {
    if (
      resolution.remaining.length === 1 &&
      requestsVersion(resolution.remaining)
    ) {
      console.log(`${CLI_NAME} v${CLI_VERSION}`);
      return;
    }
    if (
      resolution.remaining.length === 0 ||
      requestsHelp(resolution.remaining)
    ) {
      printHelp(resolution.group, resolution.path);
      return;
    }
    if (requestsVersion(resolution.remaining)) {
      console.log(`${CLI_NAME} v${CLI_VERSION}`);
      return;
    }
    const [unknownOption] = resolution.remaining;
    if (unknownOption?.startsWith("-")) {
      console.error(`Unknown option: ${unknownOption}`);
      process.exitCode = 2;
      return;
    }
    console.error(`Unknown command: ${unknownOption}`);
    process.exitCode = 2;
    return;
  }

  const command = resolution.command;
  if (!command) {
    printHelp(undefined, []);
    process.exitCode = 2;
    return;
  }

  if (
    resolution.remaining.length === 1 &&
    requestsVersion(resolution.remaining)
  ) {
    console.log(`${CLI_NAME} v${CLI_VERSION}`);
    return;
  }

  const context = {
    env: {
      isAIAgent: detectAIAgent(process.env),
    },
    store: {
      isAIAgent: detectAIAgent(process.env),
    },
  } as const;

  let parsed: ParsedCommandInput | undefined;
  let prompt: PromptApi | undefined;

  try {
    parsed = parseCommandInput(command, resolution.remaining);
    parsed.flags = mergeGlobalFlags(command, parsed.flags, globalInput.flags);
    if (parsed.helpRequested) {
      printHelp(command, resolution.path);
      return;
    }

    const terminal = detectTerminal();
    prompt = terminal.isInteractive
      ? createReadlinePrompt()
      : createNoopPrompt();
    const spinner = createSpinnerFactory(terminal);

    await command.handler({
      context,
      flags: parsed.flags as never,
      positional: parsed.positional,
      prompt,
      spinner,
      terminal,
    });
  } catch (error) {
    if (error instanceof CliUsageError) {
      console.error(error.message);
      process.exitCode = 2;
      return;
    }
    const explicitJsonFlag =
      typeof parsed?.flags.json === "boolean" ? parsed.flags.json : undefined;
    printError(error, shouldUseJsonOutput(explicitJsonFlag, context));
    process.exitCode = exitCodeForError(error);
    return;
  } finally {
    prompt?.close?.();
  }
}

export type CompletionEntry = {
  description: string;
  value: string;
};

export function listCompletionEntries(): CompletionEntry[] {
  return listPublicRootCommands().map((node) => ({
    description: node.description,
    value: node.name,
  }));
}

export function printHelp(node: CliNode | undefined, path: string[]): void {
  const lines: string[] = [];

  if (!node) {
    lines.push(`${CLI_NAME} CLI`);
    lines.push("");
    lines.push(CLI_DESCRIPTION);
    lines.push("");
    lines.push("Usage:");
    lines.push(`  ${CLI_NAME} <command> [options]`);
    lines.push("");
    lines.push("Commands:");
    for (const child of listPublicRootCommands()) {
      lines.push(`  ${child.name.padEnd(12)} ${child.description}`);
    }
    lines.push("");
    lines.push("Global options:");
    lines.push(
      `  --config <value>  ${optConfig.description ?? "Path to k-msg config"}`,
    );
    lines.push("  -h, --help     Show help");
    lines.push("  -v, --version  Show version");
    console.log(lines.join("\n"));
    return;
  }

  const usagePath = `${CLI_NAME} ${path.join(" ")}`.trim();
  lines.push(`${usagePath}`);
  lines.push("");
  lines.push(node.description);
  lines.push("");
  lines.push("Usage:");
  if (isCliCommand(node)) {
    lines.push(`  ${usagePath} [options]`);
  } else {
    lines.push(`  ${usagePath} <command> [options]`);
  }

  if (isCliGroup(node)) {
    lines.push("");
    lines.push("Commands:");
    for (const child of node.commands) {
      lines.push(`  ${child.name.padEnd(12)} ${child.description}`);
    }
  } else {
    const optionLines = formatOptionHelp(node.options);
    if (optionLines.length > 0) {
      lines.push("");
      lines.push("Options:");
      lines.push(...optionLines);
    }
  }

  lines.push("");
  lines.push("Built-ins:");
  lines.push("  -h, --help     Show help");
  lines.push("  -v, --version  Show version");

  console.log(lines.join("\n"));
}

function formatOptionHelp(options: CliOptionsShape): string[] {
  return Object.entries(options).map(([name, definition]) => {
    const long =
      definition.argumentKind === "flag" ? `--${name}` : `--${name} <value>`;
    const prefix = definition.short
      ? `-${definition.short}, ${long}`
      : `    ${long}`;
    return `  ${prefix.padEnd(28)} ${definition.description ?? ""}`.trimEnd();
  });
}

function resolveCommandPath(
  argv: string[],
  nodes: CliNode[],
): ResolutionResult {
  const tokens = [...argv];
  const path: string[] = [];
  let currentNodes = nodes;
  let lastGroup: CliGroupDefinition | undefined;
  let command: CliCommandDefinition | undefined;

  while (tokens.length > 0) {
    const token = tokens[0];
    if (!token || token.startsWith("-")) {
      break;
    }

    const nextNode = currentNodes.find((node) => node.name === token);
    if (!nextNode) {
      if (command) {
        break;
      }
      return {
        group: lastGroup,
        path,
        remaining: tokens,
        unknownCommand: token,
      };
    }

    path.push(token);
    tokens.shift();

    if (isCliGroup(nextNode)) {
      lastGroup = nextNode;
      currentNodes = nextNode.commands;
      command = undefined;
      continue;
    }

    command = nextNode;
    break;
  }

  return {
    command,
    group: command ? lastGroup : lastGroup,
    path,
    remaining: tokens,
  };
}

function parseCommandInput(
  command: CliCommandDefinition,
  argv: string[],
): ParsedCommandInput {
  const rawFlags = new Map<string, unknown>();
  let helpRequested = false;
  const positional: string[] = [];
  const longOptionMap = new Map<string, CliOptionDefinition>(
    Object.entries(command.options) as Array<[string, CliOptionDefinition]>,
  );
  const shortOptionMap = new Map(
    (Object.entries(command.options) as Array<[string, CliOptionDefinition]>)
      .filter(([, definition]) => typeof definition.short === "string")
      .map(([name, definition]) => [definition.short ?? "", name] as const),
  );

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }
    if (token === "--") {
      positional.push(...argv.slice(index + 1));
      break;
    }
    if (token === "--help" || token === "-h") {
      helpRequested = true;
      continue;
    }

    if (token.startsWith("--no-")) {
      const optionName = token.slice("--no-".length);
      const definition = longOptionMap.get(optionName);
      if (definition?.argumentKind !== "flag") {
        throw new CliUsageError(`Unknown option: ${token}`);
      }
      rawFlags.set(optionName, false);
      continue;
    }

    if (token.startsWith("--")) {
      const rawToken = token.slice(2);
      const separatorIndex = rawToken.indexOf("=");
      const rawName =
        separatorIndex === -1 ? rawToken : rawToken.slice(0, separatorIndex);
      const inlineValue =
        separatorIndex === -1 ? undefined : rawToken.slice(separatorIndex + 1);
      const definition = longOptionMap.get(rawName);
      if (!definition) {
        throw new CliUsageError(`Unknown option: --${rawName}`);
      }

      if (definition.argumentKind === "flag") {
        const nextToken = argv[index + 1];
        if (inlineValue !== undefined) {
          rawFlags.set(rawName, inlineValue);
          continue;
        }
        if (typeof nextToken === "string" && !nextToken.startsWith("-")) {
          rawFlags.set(rawName, nextToken);
          index += 1;
          continue;
        }
        rawFlags.set(rawName, true);
        continue;
      }

      const value =
        inlineValue !== undefined
          ? inlineValue
          : (argv[index + 1] ?? undefined);
      if (value === undefined) {
        throw new CliUsageError(`Missing value for option: --${rawName}`);
      }
      if (inlineValue === undefined) {
        index += 1;
      }
      rawFlags.set(rawName, value);
      continue;
    }

    if (token.startsWith("-")) {
      const shortName = token.slice(1);
      const optionName = shortOptionMap.get(shortName);
      if (!optionName) {
        throw new CliUsageError(`Unknown option: ${token}`);
      }

      const definition = command.options[optionName];
      if (definition.argumentKind === "flag") {
        const nextToken = argv[index + 1];
        if (typeof nextToken === "string" && !nextToken.startsWith("-")) {
          rawFlags.set(optionName, nextToken);
          index += 1;
          continue;
        }
        rawFlags.set(optionName, true);
        continue;
      }

      const value = argv[index + 1];
      if (value === undefined) {
        throw new CliUsageError(`Missing value for option: ${token}`);
      }
      rawFlags.set(optionName, value);
      index += 1;
      continue;
    }

    positional.push(token);
  }

  if (helpRequested) {
    return { flags: {}, helpRequested, positional };
  }

  if (positional.length > command.maxPositionals) {
    const unexpected = positional[command.maxPositionals];
    throw new CliUsageError(
      `Unexpected argument: ${unexpected ?? positional.at(-1) ?? ""}`,
    );
  }

  const flags: Record<string, unknown> = {};

  for (const [name, definition] of Object.entries(command.options) as Array<
    [string, CliOptionDefinition]
  >) {
    const value = rawFlags.has(name) ? rawFlags.get(name) : undefined;
    const parsed = definition.schema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail = issue?.message ?? "Invalid option value";
      if (value === undefined) {
        throw new CliUsageError(`Missing required option '${name}': ${detail}`);
      }
      throw new CliUsageError(`Invalid option '${name}': ${detail}`);
    }
    flags[name] = parsed.data;
  }

  return { flags, helpRequested, positional };
}

function requestsVersion(argv: string[]): boolean {
  if (argv.length === 0) {
    return false;
  }

  return argv.some((arg) => arg === "--version" || arg === "-v");
}

function requestsHelp(argv: string[]): boolean {
  return argv.some((arg) => arg === "--help" || arg === "-h");
}

function extractGlobalCommandInput(argv: string[]): GlobalCommandInput {
  const remaining = [...argv];
  const flags: GlobalCommandInput["flags"] = {};

  while (remaining.length > 0) {
    const token = remaining[0];
    if (!token?.startsWith("-")) {
      break;
    }
    if (token === "--" || token === "--help" || token === "-h") {
      break;
    }
    if (token === "--version" || token === "-v") {
      break;
    }

    if (token === "--config") {
      const value = remaining[1];
      if (value === undefined) {
        throw new CliUsageError("Missing value for option: --config");
      }
      flags.config = value;
      remaining.splice(0, 2);
      continue;
    }

    if (token.startsWith("--config=")) {
      flags.config = token.slice("--config=".length);
      remaining.shift();
      continue;
    }

    break;
  }

  return { flags, remaining };
}

function mergeGlobalFlags(
  command: CliCommandDefinition,
  flags: Record<string, unknown>,
  globalFlags: GlobalCommandInput["flags"],
): Record<string, unknown> {
  if ("config" in command.options && flags.config === undefined) {
    flags.config = globalFlags.config;
  }
  return flags;
}

function detectTerminal(): CliTerminal {
  return {
    columns: process.stdout.columns,
    isCI: isTruthyEnv(process.env.CI),
    isInteractive:
      Boolean(process.stdin.isTTY) &&
      Boolean(process.stdout.isTTY) &&
      process.env.TERM !== "dumb",
    rows: process.stdout.rows,
  };
}

function detectAIAgent(env: NodeJS.ProcessEnv): boolean {
  return hasAnyNonEmptyEnv(env, [
    "CLAUDECODE",
    "CURSOR_AGENT",
    "CODEX_CI",
    "CODEX_SHELL",
    "CODEX_THREAD_ID",
    "MCP_SERVER_NAME",
    "MCP_SESSION_ID",
    "MCP_TOOL_NAME",
  ]);
}

function hasAnyNonEmptyEnv(
  env: NodeJS.ProcessEnv,
  keys: readonly string[],
): boolean {
  return keys.some((key) => {
    const value = env[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function isTruthyEnv(value: string | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

function createSpinnerFactory(terminal: CliTerminal): CliSpinnerFactory {
  return (initialMessage) => new ConsoleSpinner(terminal, initialMessage);
}

class ConsoleSpinner implements CliSpinnerHandle {
  #active = false;
  #message: string;
  #terminal: CliTerminal;

  constructor(terminal: CliTerminal, message: string) {
    this.#terminal = terminal;
    this.#message = message;
  }

  start(): void {
    this.#active = true;
    this.#render(this.#message);
  }

  update(message: string): void {
    this.#message = message;
    if (this.#active) {
      this.#render(message);
    }
  }

  stop(): void {
    if (!this.#active) {
      return;
    }
    this.#active = false;
    this.#render("");
  }

  succeed(message?: string): void {
    this.#active = false;
    const line = message ?? this.#message;
    if (this.#terminal.isInteractive) {
      process.stdout.write(`\r${line}\n`);
      return;
    }
    console.log(line);
  }

  #render(message: string): void {
    if (!this.#terminal.isInteractive) {
      return;
    }
    const clear = " ".repeat(Math.max(0, (this.#terminal.columns ?? 80) - 1));
    process.stdout.write(`\r${clear}\r${message}`);
  }
}

function createNoopPrompt(): PromptApi {
  return {
    async confirm() {
      throw new CliUsageError(
        "Interactive prompt is unavailable in this terminal.",
      );
    },
    close() {},
    async select() {
      throw new CliUsageError(
        "Interactive prompt is unavailable in this terminal.",
      );
    },
    async text() {
      throw new CliUsageError(
        "Interactive prompt is unavailable in this terminal.",
      );
    },
  };
}

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}
