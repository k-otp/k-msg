#!/usr/bin/env bun

import { normalizeExplicitEmptyStringArgs } from "./cli/argv";
import { createKMsgCli } from "./cli/create";

class BunliExit extends Error {
  constructor(readonly exitCode: number) {
    super(`process.exit(${exitCode})`);
    this.name = "BunliExit";
  }
}

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const STRICT_BOOLEAN_FLAGS = new Map<string, string>([
  ["--dry-run", "dry-run"],
  ["--failover", "failover"],
  ["--force", "force"],
  ["--json", "json"],
  ["--stdin", "stdin"],
  ["--verbose", "verbose"],
  ["-f", "force"],
]);

async function main(): Promise<void> {
  // Bunli currently uses `-v` as a built-in version flag and calls `process.exit(1)`
  // on validation/unknown-command errors. We intercept `process.exit` so we can map
  // those cases to our planned exit codes.
  const originalExit = process.exit;
  (process as unknown as { exit: (code?: number) => never }).exit = (
    code?: number,
  ): never => {
    throw new BunliExit(typeof code === "number" ? code : 0);
  };

  try {
    const cliArgs = normalizeStrictBooleanArgs(
      normalizeExplicitEmptyStringArgs(
        normalizeBuiltinFormatArgs(process.argv.slice(2)),
      ),
    );
    const cli = await createKMsgCli();
    await cli.run(cliArgs);
  } catch (error) {
    if (error instanceof BunliExit) {
      // Bunli uses exit(1) for input/usage errors; we standardize those to 2.
      process.exitCode = error.exitCode === 1 ? 2 : error.exitCode;
      return;
    }
    if (error instanceof CliUsageError) {
      console.error(error.message);
      process.exitCode = 2;
      return;
    }
    throw error;
  } finally {
    process.exit = originalExit;
  }
}

function normalizeBuiltinFormatArgs(argv: string[]): string[] {
  const separatorIndex = argv.indexOf("--");
  const commandArgs =
    separatorIndex >= 0 ? argv.slice(0, separatorIndex) : argv;
  const passthroughArgs = separatorIndex >= 0 ? argv.slice(separatorIndex) : [];

  const hasExplicitFormat = commandArgs.some(
    (arg, index) =>
      arg === "--format" ||
      arg.startsWith("--format=") ||
      (arg === "-f" && index < commandArgs.length - 1),
  );

  if (hasExplicitFormat) {
    return argv;
  }

  const requestsBuiltinHelpOrVersion = commandArgs.some(
    (arg) =>
      arg === "--help" || arg === "-h" || arg === "--version" || arg === "-v",
  );

  if (!requestsBuiltinHelpOrVersion) {
    return argv;
  }

  return [...commandArgs, "--format", "toon", ...passthroughArgs];
}

function normalizeStrictBooleanArgs(argv: string[]): string[] {
  const normalized: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg.startsWith("--no-")) {
      normalized.push(arg);
      continue;
    }

    const [flagName, inlineValue] = arg.split("=", 2);
    const strictFlagName = STRICT_BOOLEAN_FLAGS.get(flagName);
    if (!strictFlagName) {
      normalized.push(arg);
      continue;
    }

    if (typeof inlineValue === "string") {
      assertStrictBooleanValue(strictFlagName, inlineValue);
      normalized.push(arg);
      continue;
    }

    const nextArg = argv[index + 1];
    if (typeof nextArg === "string" && !nextArg.startsWith("-")) {
      assertStrictBooleanValue(strictFlagName, nextArg);
      normalized.push(arg, nextArg);
      index += 1;
      continue;
    }

    normalized.push(arg);
  }

  return normalized;
}

function assertStrictBooleanValue(flagName: string, value: string): void {
  if (value === "true" || value === "false") {
    return;
  }

  throw new CliUsageError(
    `Invalid option '${flagName}': expected true or false`,
  );
}

await main();
