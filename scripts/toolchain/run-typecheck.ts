import { availableParallelism } from "node:os";
import path from "node:path";
import type { Subprocess } from "bun";
import { resolveWorkspaceTsgoBinary } from "./ttsc-graph-command";
import {
  docsTypecheckBoundary,
  type TypecheckTarget,
  typecheckTargets,
} from "./typecheck-targets";

type Compiler = "tsc" | "ttsc";

type TargetResult = {
  durationMs: number;
  exitCode: number;
  output: string;
  target: TypecheckTarget;
};

const repoRoot = path.resolve(import.meta.dir, "../..");

function readConcurrency(): number {
  const flagIndex = process.argv.indexOf("--concurrency");
  if (flagIndex < 0) {
    // Each ttsc target pays a fixed type-aware lint sidecar startup, so the
    // registry runs in parallel; cap it to keep memory predictable.
    return Math.max(1, Math.min(availableParallelism(), 8));
  }

  const value = Number(process.argv[flagIndex + 1]);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  return value;
}

function readCompiler(): Compiler {
  const flagIndex = process.argv.indexOf("--compiler");
  const value = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  if (value === "tsc" || value === "ttsc") {
    return value;
  }

  throw new Error("Expected --compiler ttsc or --compiler tsc");
}

async function run(command: readonly string[], label: string): Promise<void> {
  const processHandle = Bun.spawn([...command], {
    cwd: repoRoot,
    stderr: "inherit",
    stdout: "inherit",
  });
  const exitCode = await processHandle.exited;
  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}`);
  }
}

type RunningTarget = {
  child: Subprocess;
  target: TypecheckTarget;
};

async function runTarget(
  compiler: Compiler,
  target: TypecheckTarget,
  compilerOptions: readonly string[],
  running: Set<RunningTarget>,
): Promise<TargetResult> {
  const startedAt = performance.now();
  const child = Bun.spawn(
    [
      "bun",
      "x",
      compiler,
      "--noEmit",
      "--project",
      target.tsconfig,
      ...(process.stdout.isTTY ? ["--pretty"] : []),
      ...compilerOptions,
    ],
    { cwd: repoRoot, stderr: "pipe", stdout: "pipe" },
  );
  const entry = { child, target };
  running.add(entry);
  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);

    return {
      durationMs: performance.now() - startedAt,
      exitCode,
      output: `${stderr}${stdout}`.trimEnd(),
      target,
    };
  } finally {
    running.delete(entry);
  }
}

// Targets run concurrently, but results print in registry order so the first
// reported failure is still the most upstream project. After a failure no new
// target starts; results already in flight are reported when they finish.
async function runTargets(
  compiler: Compiler,
  concurrency: number,
): Promise<TargetResult[]> {
  const compilerOptions =
    compiler === "ttsc" ? ["--binary", resolveWorkspaceTsgoBinary()] : [];
  const results: (TargetResult | undefined)[] = [];
  const running = new Set<RunningTarget>();
  let nextIndex = 0;
  let printed = 0;
  let failed = false;

  const printResult = (result: TargetResult): void => {
    const seconds = (result.durationMs / 1000).toFixed(1);
    console.log(
      `\n[typecheck:${compiler}] ${result.target.label} (${seconds}s)`,
    );
    if (result.output.length > 0) {
      console.log(result.output);
    }
  };

  const printReady = (): void => {
    for (
      let result = results[printed];
      result !== undefined;
      result = results[printed]
    ) {
      printResult(result);
      printed += 1;
    }
  };

  // A cancelled CI job or Ctrl-C must not discard finished diagnostics that
  // are still waiting behind a slower target, nor leave compilers running.
  const interrupt = (signal: NodeJS.Signals): void => {
    for (const { child } of running) {
      child.kill();
    }
    for (let index = printed; index < results.length; index += 1) {
      const result = results[index];
      if (result) printResult(result);
    }
    const unfinished = [...running].map(({ target }) => target.label);
    console.error(
      `\n[typecheck] Interrupted by ${signal}${unfinished.length > 0 ? `; stopped ${unfinished.join(", ")}` : ""}.`,
    );
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);

  const worker = async (): Promise<void> => {
    while (!failed && nextIndex < typecheckTargets.length) {
      const index = nextIndex;
      nextIndex += 1;
      const result = await runTarget(
        compiler,
        typecheckTargets[index],
        compilerOptions,
        running,
      );
      results[index] = result;
      if (result.exitCode !== 0) {
        failed = true;
      }
      printReady();
    }
  };

  try {
    await Promise.all(
      Array.from(
        { length: Math.min(concurrency, typecheckTargets.length) },
        worker,
      ),
    );
  } finally {
    process.off("SIGINT", interrupt);
    process.off("SIGTERM", interrupt);
  }

  return results.filter(
    (result): result is TargetResult => result !== undefined,
  );
}

async function main(): Promise<void> {
  const compiler = readCompiler();
  const concurrency = readConcurrency();
  console.log(
    `Running workspace validation with ${compiler} (concurrency ${concurrency}).`,
  );
  console.log(
    `${docsTypecheckBoundary.workspace} remains on its compatibility boundary; use ${docsTypecheckBoundary.validationCommand}.`,
  );

  console.log("\n[typecheck:prepare] CLI generated runtime");
  await run(["bun", "run", "--cwd", "apps/cli", "generate"], "CLI generation");

  const results = await runTargets(compiler, concurrency);
  const failures = results.filter((result) => result.exitCode !== 0);
  if (failures.length > 0) {
    throw new Error(
      `${failures.map((result) => `${result.target.label} failed with exit code ${result.exitCode}`).join("; ")}. Fix the first failure first; downstream targets may repeat its diagnostics.`,
    );
  }

  console.log(`\n[typecheck:${compiler}] All targets passed.`);
}

try {
  await main();
} catch (error) {
  console.error(`\n[typecheck] ${String(error)}`);
  process.exit(1);
}
