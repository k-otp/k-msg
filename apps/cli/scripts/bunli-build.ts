import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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
  runGenerator,
} from "./bunli.shared";

const args = Bun.argv.slice(2);
const targetMode = readOptionValue(args, "--targets");
const OPENTUI_RUNTIME_VERSION = "0.1.97";
const WORKSPACE_ROOT = join(CLI_ROOT, "..", "..");

await runGenerator();
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
  await ensureRuntimePackage(target);

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
      stdout: "inherit",
      stderr: "inherit",
    },
  );

  if (result.exitCode !== 0) {
    throw new Error(`bun build failed for ${target.bunTarget}`);
  }
}

async function ensureRuntimePackage(
  target: (typeof ALL_BUILD_TARGETS)[number],
): Promise<void> {
  const packageDirName = target.runtimePackageName.split("/").pop();
  if (!packageDirName) {
    throw new Error(
      `Invalid runtime package name: ${target.runtimePackageName}`,
    );
  }

  const packageDir = join(
    WORKSPACE_ROOT,
    "node_modules",
    "@opentui",
    packageDirName,
  );
  if (await Bun.file(join(packageDir, "package.json")).exists()) {
    await relaxRuntimePackageConstraints(packageDir);
    return;
  }

  const tempRoot = join(DIST_DIR, ".npm-pack", target.archiveName);
  await removePath(tempRoot);
  await mkdir(tempRoot, { recursive: true });

  console.log(
    `Fetching ${target.runtimePackageName}@${OPENTUI_RUNTIME_VERSION} for ${target.archiveName}`,
  );

  const pack = await runCommand(
    [
      "npm",
      "pack",
      `${target.runtimePackageName}@${OPENTUI_RUNTIME_VERSION}`,
      "--silent",
    ],
    { cwd: tempRoot },
  );
  if (pack.exitCode !== 0) {
    throw new Error(
      `npm pack failed for ${target.runtimePackageName}\n${pack.stderr || pack.stdout}`,
    );
  }

  const tarball = pack.stdout.trim().split("\n").pop();
  if (!tarball) {
    throw new Error(
      `npm pack did not produce a tarball for ${target.runtimePackageName}`,
    );
  }

  const unpack = await runCommand(["tar", "-xzf", tarball, "-C", tempRoot], {
    cwd: tempRoot,
  });
  if (unpack.exitCode !== 0) {
    throw new Error(
      `tar extract failed for ${target.runtimePackageName}\n${unpack.stderr || unpack.stdout}`,
    );
  }

  await mkdir(join(WORKSPACE_ROOT, "node_modules", "@opentui"), {
    recursive: true,
  });
  await removePath(packageDir);
  await rename(join(tempRoot, "package"), packageDir);
  await relaxRuntimePackageConstraints(packageDir);
  await removePath(tempRoot);
}

async function relaxRuntimePackageConstraints(
  packageDir: string,
): Promise<void> {
  const packageJsonPath = join(packageDir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    os?: unknown;
    cpu?: unknown;
    [key: string]: unknown;
  };

  if (!("os" in packageJson) && !("cpu" in packageJson)) {
    return;
  }

  delete packageJson.os;
  delete packageJson.cpu;
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
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
