import completion from "@gunshi/plugin-completion";
import { cli, define } from "gunshi";
import packageJson from "../../package.json";
import {
  listCompletionEntries,
  runCommandDispatcher,
} from "./command-dispatcher";

type CompletionVersions = {
  bun?: string | undefined;
};

function hasFlagBeforeTerminator(argv: string[], flag: string): boolean {
  for (const arg of argv) {
    if (arg === "--") {
      return false;
    }
    if (arg === flag) {
      return true;
    }
  }
  return false;
}

export function shouldUseCompletionBoundary(
  argv: string[],
  _versions: CompletionVersions = process.versions,
): boolean {
  const [command] = argv;
  return (
    (command === "complete" || command === "completions") &&
    !hasFlagBeforeTerminator(argv, "--help") &&
    !hasFlagBeforeTerminator(argv, "-h") &&
    !hasFlagBeforeTerminator(argv, "--version") &&
    !hasFlagBeforeTerminator(argv, "-v")
  );
}

function normalizeCompletionArgv(argv: string[]): string[] {
  const [command, ...rest] = argv;
  return command === "completions" ? ["complete", ...rest] : argv;
}

function normalizeShortBuiltins(argv: string[]): string[] {
  let terminated = false;
  return argv.map((arg) => {
    if (terminated) {
      return arg;
    }
    if (arg === "--") {
      terminated = true;
      return arg;
    }
    if (arg === "-h") {
      return "--help";
    }
    if (arg === "-v") {
      return "--version";
    }
    return arg;
  });
}

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

export async function runCliEntrypoint(
  argv = process.argv.slice(2),
): Promise<void> {
  const normalizedArgv = normalizeShortBuiltins(argv);

  if (!shouldUseCompletionBoundary(normalizedArgv)) {
    await runCommandDispatcher(normalizedArgv);
    return;
  }

  await cli(normalizeCompletionArgv(normalizedArgv), completionCommand, {
    fallbackToEntry: true,
    name: "k-msg",
    plugins: [
      completion({
        config: {
          entry: {
            handler: () => listCompletionEntries(),
          },
        },
      }),
    ],
    usageSilent: true,
    version:
      typeof packageJson.version === "string" ? packageJson.version : "0.0.0",
  });
}
