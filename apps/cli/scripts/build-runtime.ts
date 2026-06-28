import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  ALL_BUILD_TARGETS,
  CLI_ENTRY,
  CLI_ROOT,
  DIST_DIR,
  ensureDistDir,
  getHostBuildTarget,
  removePath,
  runCommand,
} from "./cli.shared";

const args = Bun.argv.slice(2);
const targetMode = readOptionValue(args, "--targets");

await ensureDistDir();

if (targetMode === "all") {
  await buildAllTargets();
} else {
  await buildHostBinary();
}

async function buildHostBinary(): Promise<void> {
  const target = getHostBuildTarget();
  const outputPath = join(DIST_DIR, target.binaryName);

  await removePath(outputPath);
  console.log(`Compiling ${target.archiveName} -> ${outputPath}`);
  await compileTarget(target, outputPath);
}

async function buildAllTargets(): Promise<void> {
  const stagingRoot = join(DIST_DIR, ".build");

  await removePath(stagingRoot);
  await ensureDistDir();

  for (const target of ALL_BUILD_TARGETS) {
    await removePath(join(DIST_DIR, `${target.archiveName}.tar.gz`));
  }

  for (const target of ALL_BUILD_TARGETS) {
    const targetDir = join(stagingRoot, target.archiveName);
    const binaryPath = join(targetDir, target.binaryName);
    const archivePath = join(DIST_DIR, `${target.archiveName}.tar.gz`);

    await mkdir(targetDir, { recursive: true });

    console.log(`Compiling ${target.archiveName} -> ${binaryPath}`);
    await compileTarget(target, binaryPath);

    console.log(`Packaging ${archivePath}`);
    const archive = await runCommand(
      ["tar", "-czf", archivePath, "-C", stagingRoot, target.archiveName],
      { cwd: CLI_ROOT },
    );
    if (archive.exitCode !== 0) {
      throw new Error(
        `tar failed for ${target.archiveName}\n${archive.stderr || archive.stdout}`,
      );
    }

    await removePath(targetDir);
  }

  await removePath(stagingRoot);
}

async function compileTarget(
  target: (typeof ALL_BUILD_TARGETS)[number],
  outputPath: string,
): Promise<void> {
  const result = await runCommand(
    [
      process.execPath,
      "build",
      "--compile",
      `--target=${target.bunTarget}`,
      `--outfile=${outputPath}`,
      CLI_ENTRY,
    ],
    {
      cwd: CLI_ROOT,
      stderr: "inherit",
      stdout: "inherit",
    },
  );

  if (result.exitCode !== 0) {
    throw new Error(`bun build failed for ${target.bunTarget}`);
  }
}

function readOptionValue(argv: string[], name: string): string | undefined {
  const index = argv.findIndex(
    (arg) => arg === name || arg.startsWith(`${name}=`),
  );
  if (index === -1) return undefined;

  const current = argv[index];
  if (current.startsWith(`${name}=`)) {
    return current.slice(name.length + 1);
  }

  return argv[index + 1];
}
