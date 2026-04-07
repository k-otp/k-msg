import {
  CLI_ROOT,
  GENERATED_PATH,
  pathExists,
  runCommand,
  sanitizedCliEnv,
} from "./bunli.shared";

const strict = Bun.argv.includes("--strict");
const baseEnv = sanitizedCliEnv();

if (!(await pathExists(GENERATED_PATH))) {
  throw new Error(`Missing generated command metadata: ${GENERATED_PATH}`);
}

const shellChecks = [
  { shell: "bash", marker: "# bash completion for k-msg" },
  { shell: "zsh", marker: "#compdef k-msg" },
  { shell: "fish", marker: "complete -c k-msg" },
  { shell: "powershell", marker: "Register-ArgumentCompleter" },
] as const;

for (const { shell, marker } of shellChecks) {
  const result = await runCli(["completions", shell]);
  if (result.exitCode !== 0) {
    throw new Error(`completions ${shell} failed\n${result.stderr}`);
  }
  if (!result.stdout.includes(marker)) {
    throw new Error(`Unexpected completions output for ${shell}`);
  }
}

const rootCompletion = await runCli(["complete", "--", ""]);
if (rootCompletion.exitCode !== 0) {
  throw new Error(`completion protocol failed\n${rootCompletion.stderr}`);
}
if (!rootCompletion.stdout.includes("providers\tProvider utilities")) {
  throw new Error("completion protocol is missing expected command entries");
}
if (!rootCompletion.stdout.trimEnd().endsWith(":4")) {
  throw new Error("completion protocol is missing a shell directive suffix");
}

if (strict) {
  const aliasCheck = await runCli(["completions", "zsh"]);
  if (!aliasCheck.stdout.includes("compdef _k-msg k-msg")) {
    throw new Error("zsh completion output is missing the compdef registration");
  }
}

console.log("✓ Completion metadata and shell scripts look healthy");

async function runCli(argv: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return runCommand([process.execPath, "src/k-msg.ts", ...argv], {
    cwd: CLI_ROOT,
    env: baseEnv,
  });
}
