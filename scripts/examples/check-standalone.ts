import { access, cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ExampleManifest = {
  scripts?: Record<string, string>;
};

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const examplesRoot = path.join(repositoryRoot, "examples");
const excludedEntries = new Set([
  ".dev.vars",
  ".wrangler",
  "bun.lock",
  "bun.lockb",
  "dist",
  "node_modules",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

function isSensitiveConfig(segment: string): boolean {
  return segment === ".env" || segment.startsWith(".env.");
}

function parseSelectedExample(args: string[]): string | undefined {
  if (args.length === 0) return undefined;

  if (args.length === 2 && args[0] === "--example" && args[1]) {
    return args[1];
  }

  if (args.length === 1 && args[0]?.startsWith("--example=")) {
    const value = args[0].slice("--example=".length);
    if (value) return value;
  }

  throw new Error(
    "Usage: bun run scripts/examples/check-standalone.ts [--example <name>]",
  );
}

async function listExamples(): Promise<string[]> {
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  const names: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(examplesRoot, entry.name, "package.json");
    try {
      await access(manifestPath);
      names.push(entry.name);
    } catch {
      // Ignore supporting directories that are not runnable examples.
    }
  }

  return names.sort();
}

function shouldCopy(source: string): boolean {
  return !source
    .split(path.sep)
    .some(
      (segment) => excludedEntries.has(segment) || isSensitiveConfig(segment),
    );
}

async function runCommand(command: string[], cwd: string): Promise<void> {
  console.log(`$ ${command.join(" ")}`);
  const processHandle = Bun.spawn(command, {
    cwd,
    env: { ...Bun.env, CI: Bun.env.CI ?? "1" },
    stderr: "inherit",
    stdin: "ignore",
    stdout: "inherit",
  });
  const exitCode = await processHandle.exited;
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed with exit code ${exitCode}`);
  }
}

async function validateExample(name: string): Promise<void> {
  const sourceDir = path.join(examplesRoot, name);
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), `k-msg-${name}-`));
  const temporaryExample = path.join(temporaryRoot, name);

  try {
    await cp(sourceDir, temporaryExample, {
      filter: shouldCopy,
      recursive: true,
    });

    const manifest = JSON.parse(
      await readFile(path.join(temporaryExample, "package.json"), "utf8"),
    ) as ExampleManifest;

    console.log(`\n== ${name}: install ==`);
    await runCommand(["bun", "install", "--no-save"], temporaryExample);

    console.log(`== ${name}: validate ==`);
    if (manifest.scripts?.typecheck) {
      await runCommand(["bun", "run", "typecheck"], temporaryExample);
      return;
    }

    if (name === "express-node-send-only") {
      await runCommand(["node", "--check", "src/index.mjs"], temporaryExample);
      return;
    }

    throw new Error(`${name} does not define a standalone validation command`);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function main(): Promise<void> {
  const selectedExample = parseSelectedExample(process.argv.slice(2));
  const examples = await listExamples();

  if (selectedExample && !examples.includes(selectedExample)) {
    throw new Error(`Unknown example: ${selectedExample}`);
  }

  const targets = selectedExample ? [selectedExample] : examples;
  const failures: string[] = [];
  for (const target of targets) {
    try {
      await validateExample(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${target}: ${message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Validation failed for ${failures.length} example(s):\n${failures.join("\n")}`,
    );
  }

  console.log(`\nValidated ${targets.length} standalone example(s).`);
}

await main();
