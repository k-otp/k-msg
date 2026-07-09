import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const runnerDir = path.join(repoRoot, ".cache", "ttsc-ts7-runner");
const runnerManifestPath = path.join(runnerDir, "package.json");
const runnerTtscPath = path.join(
  runnerDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "ttsc.cmd" : "ttsc",
);
const runnerNodeModulesPath = path.join(runnerDir, "node_modules");

const ts7Version = "7.0.2";
const ttscVersion = "0.18.0";

const targets = [
  {
    label: "@k-msg/core build types",
    tsconfig: "packages/core/tsconfig.json",
  },
  {
    label: "@k-msg/template build types",
    tsconfig: "packages/template/tsconfig.json",
  },
  {
    label: "@k-msg/provider build types",
    tsconfig: "packages/provider/tsconfig.json",
  },
  {
    label: "@k-msg/messaging build types",
    tsconfig: "packages/messaging/tsconfig.json",
  },
  {
    label: "@k-msg/analytics typecheck",
    tsconfig: "packages/analytics/tsconfig.json",
  },
  {
    label: "@k-msg/channel typecheck",
    tsconfig: "packages/channel/tsconfig.json",
  },
  {
    label: "@k-msg/webhook typecheck",
    tsconfig: "packages/webhook/tsconfig.json",
  },
  {
    label: "k-msg package typecheck",
    tsconfig: "packages/k-msg/tsconfig.json",
  },
  {
    label: "CLI typecheck",
    tsconfig: "apps/cli/tsconfig.json",
  },
] as const;

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getRunnerManifest(): string {
  return `${JSON.stringify(
    {
      name: "k-msg-ttsc-ts7-runner",
      private: true,
      packageManager: "bun@1.3.13",
      devDependencies: {
        ttsc: ttscVersion,
        typescript: ts7Version,
      },
    },
    null,
    2,
  )}\n`;
}

async function ensureRunner({ force }: { force: boolean }): Promise<void> {
  await mkdir(runnerDir, { recursive: true });

  const desiredManifest = getRunnerManifest();
  let needsInstall = force || !(await fileExists(runnerTtscPath));

  let currentManifest: null | string = null;
  try {
    currentManifest = await readFile(runnerManifestPath, "utf8");
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : null;
    if (errorCode !== "ENOENT") {
      throw error;
    }
    currentManifest = null;
  }

  if (currentManifest !== desiredManifest) {
    await writeFile(runnerManifestPath, desiredManifest, "utf8");
    needsInstall = true;
  }

  if (!needsInstall) {
    return;
  }

  console.log(
    `Preparing isolated TS7/ttsc runner in ${path.relative(repoRoot, runnerDir) || runnerDir}`,
  );

  const proc = Bun.spawn(["bun", "install"], {
    cwd: runnerDir,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

async function runTarget(target: (typeof targets)[number]): Promise<void> {
  const tsconfigPath = path.join(repoRoot, target.tsconfig);
  console.log(`\n[ttsc-ts7] ${target.label}`);

  const proc = Bun.spawn(
    [runnerTtscPath, "--noEmit", "--project", tsconfigPath],
    {
      cwd: runnerDir,
      env: {
        ...process.env,
        NODE_PATH: runnerNodeModulesPath,
      },
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

async function cleanRunner(): Promise<void> {
  await rm(runnerDir, { force: true, recursive: true });
  console.log(`Removed ${path.relative(repoRoot, runnerDir) || runnerDir}`);
}

try {
  if (hasFlag("--clean")) {
    await cleanRunner();
    process.exit(0);
  }

  const forceInstall = hasFlag("--force-install");
  const installOnly = hasFlag("--install-only");

  console.log(
    `Running isolated ttsc lane with TypeScript ${ts7Version} and ttsc ${ttscVersion}`,
  );
  console.log(
    "Docs toolchain is intentionally excluded from this experiment because the site still depends on a separate TypeDoc/Astro stack.",
  );

  await ensureRunner({ force: forceInstall });

  if (installOnly) {
    console.log("Runner installation complete.");
    process.exit(0);
  }

  for (const target of targets) {
    await runTarget(target);
  }

  console.log("\n[ttsc-ts7] All experimental targets passed.");
} catch (error) {
  console.error("\n[ttsc-ts7] Fatal error:", error);
  process.exit(1);
}
