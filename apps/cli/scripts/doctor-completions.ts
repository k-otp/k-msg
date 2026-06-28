import { CLI_ROOT, runCommand, sanitizedCliEnv } from "./cli.shared";

const strict = Bun.argv.includes("--strict");
const baseEnv = sanitizedCliEnv();

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
if (!rootCompletion.stdout.trimEnd().endsWith(":4")) {
  throw new Error("completion protocol is missing a shell directive suffix");
}

if (strict) {
  const aliasCheck = await runCli(["completions", "zsh"]);
  const [firstLine] = aliasCheck.stdout.split(/\r?\n/, 1);
  if (firstLine !== "#compdef k-msg") {
    throw new Error(
      "zsh completion output must keep the #compdef k-msg header for installer alias patching",
    );
  }
  if (!aliasCheck.stdout.includes("compdef _k-msg k-msg")) {
    throw new Error(
      "zsh completion output is missing the primary compdef registration",
    );
  }
}

console.log("✓ Completion scripts and entry metadata look healthy");

async function runCli(argv: string[]): Promise<{
  exitCode: number;
  stderr: string;
  stdout: string;
}> {
  return runCommand([process.execPath, "src/k-msg.ts", ...argv], {
    cwd: CLI_ROOT,
    env: baseEnv,
  });
}
