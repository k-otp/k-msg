import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const checkMode = process.argv.includes("--check");
const outputPath = path.join(repoRoot, "apps/docs/src/generated/cli/help.md");
const cliEntry = path.join(repoRoot, "apps/cli/src/k-msg.ts");

const targets: string[][] = [
  ["--help"],
  ["alimtalk", "--help"],
  ["config", "--help"],
  ["kakao", "--help"],
  ["providers", "--help"],
  ["send", "--help"],
  ["sms", "--help"],
];

async function runCommand(args: string[]): Promise<string> {
  const cmd = ["bun", cliEntry, ...args];
  const proc = Bun.spawn(cmd, {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(`CLI help command failed (${cmd.join(" ")}): ${stderr || stdout}`);
  }

  return stdout.trimEnd();
}

async function renderHelpMarkdown(): Promise<string> {
  const sections: string[] = [
    "## CLI Help",
    "",
    "Generated from `apps/cli/src/k-msg.ts`.",
    "",
  ];

  for (const args of targets) {
    const title = args[0] === "--help" ? "k-msg --help" : `k-msg ${args[0]} --help`;
    const output = await runCommand(args);

    sections.push(`## ${title}`);
    sections.push("");
    sections.push("```text");
    sections.push(output);
    sections.push("```");
    sections.push("");
  }

  return sections.join("\n");
}

async function main(): Promise<void> {
  const next = await renderHelpMarkdown();

  let current = "";
  try {
    current = await readFile(outputPath, "utf8");
  } catch {
    current = "";
  }

  if (checkMode) {
    if (current !== next) {
      console.error(`CLI help docs out of date: ${outputPath}`);
      process.exit(1);
    }
    console.log(`ok: ${outputPath}`);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, next, "utf8");
  console.log(`generated: ${outputPath}`);
}

await main();
