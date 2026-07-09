import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  cleanRunner,
  ensureRunner,
  repoRoot,
  runnerRelativePath,
  spawnRunner,
  toolchainVersions,
} from "./ts7-runner";

type BenchmarkRecord = {
  category: "setup" | "validation" | "exploration";
  command: string;
  notes: string;
  result: "pass" | "fail";
  seconds: number;
  title: string;
};

const defaultOutputPath = path.join(
  repoRoot,
  "docs",
  "migration",
  "typescript-7-toolchain-benchmarks.md",
);

function parseFlagValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index >= 0 && index + 1 < process.argv.length) {
    return process.argv[index + 1] ?? null;
  }

  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

function relativeToBaseline(
  seconds: number,
  baselineSeconds: number,
): string | null {
  if (baselineSeconds <= 0) {
    return null;
  }

  if (Math.abs(seconds - baselineSeconds) < 0.001) {
    return "baseline";
  }

  if (seconds < baselineSeconds) {
    return `${(baselineSeconds / seconds).toFixed(2)}x faster`;
  }

  return `${(seconds / baselineSeconds).toFixed(2)}x slower`;
}

function formatLocalTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(
    2,
    "0",
  );
  const offsetRemainder = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetRemainder}`;
}

async function measureCommand(
  args: string[],
  {
    command,
    cwd = repoRoot,
    env,
  }: {
    command: string;
    cwd?: string;
    env?: Record<string, string | undefined>;
  },
): Promise<{
  exitCode: number;
  seconds: number;
  stderr: string;
  stdout: string;
}> {
  const startedAt = performance.now();
  const proc = Bun.spawn(args, {
    cwd,
    env,
    stderr: "pipe",
    stdout: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
    proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
    proc.exited,
  ]);

  const seconds = (performance.now() - startedAt) / 1000;
  if (exitCode !== 0) {
    const output = `${stdout}\n${stderr}`.trim();
    throw new Error(`Command failed: ${command}\n${output}`);
  }

  return { exitCode, seconds, stderr, stdout };
}

async function measureRunnerInstall(): Promise<BenchmarkRecord> {
  await cleanRunner({ quiet: true });

  const startedAt = performance.now();
  await ensureRunner({ quiet: true, withGraph: true });
  const seconds = (performance.now() - startedAt) / 1000;

  return {
    category: "setup",
    command: "bun run typecheck:ttsc:ts7:install",
    notes: `Cold install into ${runnerRelativePath()}`,
    result: "pass",
    seconds,
    title: "TS7 runner cold install",
  };
}

async function measureRootTypecheck(): Promise<BenchmarkRecord> {
  const measurement = await measureCommand(["bun", "run", "typecheck"], {
    command: "bun run typecheck",
  });

  return {
    category: "validation",
    command: "bun run typecheck",
    notes: "Current workspace default lane",
    result: measurement.exitCode === 0 ? "pass" : "fail",
    seconds: measurement.seconds,
    title: "Root default typecheck",
  };
}

async function measureTtscTypecheck(): Promise<BenchmarkRecord> {
  await ensureRunner({ quiet: true, withGraph: true });
  const measurement = await measureCommand(
    ["bun", "run", "typecheck:ttsc:ts7"],
    {
      command: "bun run typecheck:ttsc:ts7",
    },
  );

  return {
    category: "validation",
    command: "bun run typecheck:ttsc:ts7",
    notes: "Warm isolated TS7/ttsc lane",
    result: measurement.exitCode === 0 ? "pass" : "fail",
    seconds: measurement.seconds,
    title: "TS7/ttsc validation lane",
  };
}

async function measureGraphDump(): Promise<BenchmarkRecord> {
  await ensureRunner({ quiet: true, withGraph: true });
  const startedAt = performance.now();
  const proc = await spawnRunner(
    "ttsc-graph",
    ["dump", "--cwd", repoRoot, "--tsconfig", "tsconfig.json"],
    {
      stderr: "pipe",
      stdout: "pipe",
    },
  );

  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
    proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
    proc.exited,
  ]);
  const seconds = (performance.now() - startedAt) / 1000;

  if (exitCode !== 0) {
    throw new Error(
      `Command failed: bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json\n${`${stdout}\n${stderr}`.trim()}`,
    );
  }

  return {
    category: "exploration",
    command: "bun run graph:ttsc:ts7 -- dump --tsconfig tsconfig.json",
    notes: "Warm graph dump for the root workspace tsconfig",
    result: "pass",
    seconds,
    title: "TS7 graph dump",
  };
}

function renderTable(
  title: string,
  rows: BenchmarkRecord[],
  baselineSeconds?: number,
): string {
  const tableRows = rows
    .map((row) => {
      const relative =
        baselineSeconds && row.category === "validation"
          ? (relativeToBaseline(row.seconds, baselineSeconds) ?? "-")
          : "-";

      return `| ${row.title} | \`${row.command}\` | ${row.result} | \`${formatSeconds(row.seconds)}\` | ${relative} | ${row.notes} |`;
    })
    .join("\n");

  return `## ${title}

| Scenario | Command | Result | Wall time | Relative to \`bun run typecheck\` | Notes |
| --- | --- | --- | ---: | ---: | --- |
${tableRows}`;
}

function renderReport(records: BenchmarkRecord[]): string {
  const validationRows = records.filter(
    (record) => record.category === "validation",
  );
  const otherRows = records.filter(
    (record) => record.category !== "validation",
  );
  const baselineSeconds =
    validationRows.find((record) => record.command === "bun run typecheck")
      ?.seconds ?? 0;

  return `# TypeScript 7 Toolchain Benchmarks

Generated on ${formatLocalTimestamp(new Date())} from the repository root with:

- workspace baseline: current root \`typecheck\` lane
- isolated runner: \`ttsc@${toolchainVersions.ttsc}\`
- graph tool: \`@ttsc/graph@${toolchainVersions.ttscGraph}\`

${renderTable("Validation Lanes", validationRows, baselineSeconds)}

${renderTable("Setup And Exploration Costs", otherRows)}

## Reading The Snapshot

- \`Relative\` is only meant for the validation-lane comparison and uses \`bun run typecheck\` as the baseline.
- The root lane includes the current package \`build:types\` flow plus CLI generation before \`tsc --noEmit\`.
- The isolated TS7 lane is a pure \`--noEmit\` pass over selected package, CLI, and docs-hono tsconfigs.
- The graph dump measures analysis startup cost for \`ttsc-graph\`, not a CI-quality replacement for typecheck.
- Absolute numbers depend on machine state; the checked-in value is mainly useful as a repeatable reference point for this repository.
`;
}

async function main(): Promise<void> {
  const outputPath = parseFlagValue("--out") ?? defaultOutputPath;
  const printOnly = hasFlag("--stdout");

  const records = [
    await measureRunnerInstall(),
    await measureRootTypecheck(),
    await measureTtscTypecheck(),
    await measureGraphDump(),
  ];

  const report = renderReport(records);
  if (printOnly) {
    console.log(report);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${report}\n`, "utf8");
  console.log(
    `Wrote benchmark snapshot to ${path.relative(repoRoot, outputPath) || outputPath}`,
  );
}

try {
  await main();
} catch (error) {
  console.error("\n[ttsc-ts7-bench] Fatal error:", error);
  process.exit(1);
}
