import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

type BenchmarkRecord = {
  command: string;
  medianSeconds: number;
  notes: string;
  runs: number;
  title: string;
};

const repoRoot = path.resolve(import.meta.dir, "../..");
const requireFromRoot = createRequire(path.join(repoRoot, "package.json"));
const defaultOutputPath = path.join(
  repoRoot,
  "docs",
  "migration",
  "typescript-7-toolchain-benchmarks.md",
);

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function flagValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

async function runOnce(command: readonly string[]): Promise<number> {
  const startedAt = performance.now();
  const processHandle = Bun.spawn([...command], {
    cwd: repoRoot,
    stderr: "pipe",
    stdout: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    processHandle.stdout
      ? new Response(processHandle.stdout).text()
      : Promise.resolve(""),
    processHandle.stderr
      ? new Response(processHandle.stderr).text()
      : Promise.resolve(""),
    processHandle.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(
      `Command failed with exit code ${exitCode}: ${command.join(" ")}\n${`${stdout}\n${stderr}`.trim()}`,
    );
  }
  return (performance.now() - startedAt) / 1000;
}

async function measure(input: {
  command: readonly string[];
  notes: string;
  runs: number;
  title: string;
}): Promise<BenchmarkRecord> {
  const timings: number[] = [];
  for (let index = 0; index < input.runs; index += 1) {
    timings.push(await runOnce(input.command));
  }

  return {
    command: input.command.join(" "),
    medianSeconds: median(timings),
    notes: input.notes,
    runs: input.runs,
    title: input.title,
  };
}

function relative(value: number, baseline: number): string {
  if (Math.abs(value - baseline) < 0.001) {
    return "baseline";
  }
  return value < baseline
    ? `${(baseline / value).toFixed(2)}x faster`
    : `${(value / baseline).toFixed(2)}x slower`;
}

async function packageVersion(packageName: string): Promise<string> {
  let packagePath: string;
  try {
    packagePath = requireFromRoot.resolve(`${packageName}/package.json`);
  } catch (error) {
    throw new Error(
      `Cannot resolve ${packageName}; run bun install before benchmarking: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(packagePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Cannot read ${packageName} version from ${packagePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (
    typeof manifest !== "object" ||
    manifest === null ||
    !("version" in manifest) ||
    typeof manifest.version !== "string"
  ) {
    throw new Error(`${packageName} package manifest has no string version.`);
  }
  return manifest.version;
}

function renderReport(records: readonly BenchmarkRecord[]): string {
  const ttscBaseline = records.find(
    (record) => record.title === "Workspace ttsc",
  )?.medianSeconds;
  if (
    ttscBaseline === undefined ||
    !Number.isFinite(ttscBaseline) ||
    ttscBaseline <= 0
  ) {
    throw new Error(
      "Workspace ttsc benchmark did not produce a valid baseline.",
    );
  }
  const rows = records
    .map(
      (record) =>
        `| ${record.title} | \`${record.command}\` | ${record.runs} | \`${record.medianSeconds.toFixed(3)}s\` | ${relative(record.medianSeconds, ttscBaseline)} | ${record.notes} |`,
    )
    .join("\n");

  return `# TypeScript 7 Toolchain Benchmarks

This repository snapshot compares the default \`ttsc\` path with the TypeScript 7 \`tsc\` fallback on the same machine and checkout. Validation timings use the median of repeated warm runs; docs and graph rows use one run because they measure different workloads.

Generated on \`${new Date().toISOString()}\` for \`${process.platform}-${process.arch}\`.

- Bun: \`${Bun.version}\`
- \`ttsc\`: \`${ttscVersion}\`
- \`@ttsc/graph\`: \`${graphVersion}\`
- \`typescript\`: \`${typescriptVersion}\`

| Scenario | Command | Runs | Median wall time | Relative to workspace ttsc | Notes |
| --- | --- | ---: | ---: | ---: | --- |
${rows}

## Interpretation

- \`bun run typecheck\` is the canonical CI path. It covers packages, CLI, repository tooling, and TypeScript examples, and includes type-aware \`@ttsc/lint\` diagnostics.
- \`bun run typecheck:tsc\` is a parity and incident fallback. It checks the same target registry without running ttsc plugins.
- The fallback is faster in this snapshot because \`ttsc\` starts the semantic plugin host for each project. The default selects combined diagnostics and architecture guarantees rather than claiming a raw compiler-speed win.
- Focused package rows estimate the feedback loop for a small library edit without CLI generation or workspace traversal.
- The graph gate validates package dependency direction, cycles, and the checked-in architecture snapshot; it does not replace typechecking.
- \`apps/docs\` remains on its local TypeScript 6 compatibility boundary, so docs generation/build timings are reported separately.
- Absolute timings depend on cache and machine state. Re-run \`bun run benchmark:ttsc\` after toolchain or target-scope changes.
`;
}

const ttscVersion = await packageVersion("ttsc");
const graphVersion = await packageVersion("@ttsc/graph");
const typescriptVersion = await packageVersion("typescript");

const validationRuns = Number(flagValue("--runs") ?? "3");
if (!Number.isInteger(validationRuns) || validationRuns < 1) {
  throw new Error("--runs must be a positive integer");
}

const records: BenchmarkRecord[] = [];
records.push(
  await measure({
    command: ["bun", "run", "typecheck"],
    notes: "Canonical workspace validation with type-aware lint diagnostics",
    runs: validationRuns,
    title: "Workspace ttsc",
  }),
  await measure({
    command: ["bun", "run", "typecheck:tsc"],
    notes: "Same target registry through the compiler fallback",
    runs: validationRuns,
    title: "Workspace tsc fallback",
  }),
  await measure({
    command: [
      "bun",
      "x",
      "ttsc",
      "--noEmit",
      "--project",
      "packages/core/tsconfig.json",
    ],
    notes: "Small-package edit feedback with ttsc lint enabled",
    runs: validationRuns,
    title: "Focused core ttsc",
  }),
  await measure({
    command: [
      "bun",
      "x",
      "tsc",
      "--noEmit",
      "--project",
      "packages/core/tsconfig.json",
    ],
    notes: "Small-package edit feedback through the fallback compiler",
    runs: validationRuns,
    title: "Focused core tsc",
  }),
  await measure({
    command: ["bun", "run", "graph:ttsc:check"],
    notes: "Compiler graph architecture invariant and snapshot validation",
    runs: 1,
    title: "Graph architecture gate",
  }),
  await measure({
    command: ["bun", "run", "docs:generate"],
    notes: "Generated CLI, schema, guide, and API inputs",
    runs: 1,
    title: "Docs source generation",
  }),
);

if (!hasFlag("--quick")) {
  records.push(
    await measure({
      command: ["bun", "run", "docs:build"],
      notes: "Astro/Starlight build including TypeDoc API pages",
      runs: 1,
      title: "Starlight docs build",
    }),
  );
}

const report = renderReport(records);
if (hasFlag("--stdout")) {
  console.log(report);
} else {
  const outputPath = flagValue("--out") ?? defaultOutputPath;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${report}\n`, "utf8");
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}.`);
}
