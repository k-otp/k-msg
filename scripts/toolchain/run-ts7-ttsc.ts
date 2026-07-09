import path from "node:path";
import {
  cleanRunner,
  ensureRunner,
  repoRoot,
  runnerRelativePath,
  spawnRunner,
  toolchainVersions,
  ttscTargets,
} from "./ts7-runner";

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function printHelp(): void {
  console.log(`Usage: bun run typecheck:ttsc:ts7 [options]

Runs the isolated TypeScript 7 validation lane against package and CLI tsconfigs.

Options:
  --install-only   Prepare the cached runner and exit
  --force-install  Reinstall the cached runner before running
  --clean          Remove the cached runner and exit
  --help, -h       Print this help text

The cached runner lives in ${runnerRelativePath()}.`);
}

async function runTarget(target: (typeof ttscTargets)[number]): Promise<void> {
  const tsconfigPath = path.join(repoRoot, target.tsconfig);
  console.log(`\n[ttsc-ts7] ${target.label}`);

  const proc = await spawnRunner("ttsc", [
    "--noEmit",
    "--project",
    tsconfigPath,
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

try {
  if (hasFlag("--help") || hasFlag("-h")) {
    printHelp();
    process.exit(0);
  }

  if (hasFlag("--clean")) {
    await cleanRunner();
    process.exit(0);
  }

  const forceInstall = hasFlag("--force-install");
  const installOnly = hasFlag("--install-only");

  console.log(
    `Running isolated ttsc lane with TypeScript ${toolchainVersions.typescript} and ttsc ${toolchainVersions.ttsc}`,
  );
  console.log(
    "The Astro/Starlight docs workspace stays on its local TypeScript 6 toolchain and is validated by docs:check.",
  );

  await ensureRunner({ force: forceInstall });

  if (installOnly) {
    console.log("Runner installation complete.");
    process.exit(0);
  }

  for (const target of ttscTargets) {
    await runTarget(target);
  }

  console.log("\n[ttsc-ts7] All TS7 validation targets passed.");
} catch (error) {
  console.error("\n[ttsc-ts7] Fatal error:", error);
  process.exit(1);
}
