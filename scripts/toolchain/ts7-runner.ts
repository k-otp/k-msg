import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dir, "../..");
export const runnerDir = path.join(repoRoot, ".cache", "ttsc-ts7-runner");
const runnerManifestPath = path.join(runnerDir, "package.json");
export const runnerNodeModulesPath = path.join(runnerDir, "node_modules");

export const toolchainVersions = {
  bun: "1.3.13",
  ttsc: "0.18.0",
  ttscGraph: "0.18.0",
  typescript: "7.0.2",
} as const;

export const ttscTargets = [
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

type SpawnStream = "ignore" | "inherit" | "pipe";

type EnsureRunnerOptions = {
  force?: boolean;
  quiet?: boolean;
  withGraph?: boolean;
};

type SpawnRunnerOptions = {
  cwd?: string;
  env?: Record<string, string | undefined>;
  stderr?: SpawnStream;
  stdout?: SpawnStream;
};

const runnerPackages = {
  "@ttsc/graph": toolchainVersions.ttscGraph,
  ttsc: toolchainVersions.ttsc,
  typescript: toolchainVersions.typescript,
} as const;

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
      packageManager: `bun@${toolchainVersions.bun}`,
      devDependencies: runnerPackages,
    },
    null,
    2,
  )}\n`;
}

export function runnerRelativePath(): string {
  return path.relative(repoRoot, runnerDir) || runnerDir;
}

export function runnerExecutable(name: "ttsc" | "ttsc-graph"): string {
  if (name === "ttsc") {
    return path.join(
      runnerNodeModulesPath,
      "ttsc",
      "lib",
      "launcher",
      "ttsc.js",
    );
  }

  return path.join(runnerNodeModulesPath, "@ttsc", "graph", "lib", "bin.js");
}

export function runnerEnvironment(
  env: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    ...process.env,
    NODE_PATH: runnerNodeModulesPath,
    ...env,
  };
}

export async function ensureRunner({
  force = false,
  quiet = false,
  withGraph = false,
}: EnsureRunnerOptions = {}): Promise<void> {
  await mkdir(runnerDir, { recursive: true });

  const desiredManifest = getRunnerManifest();
  const requiredBinary = runnerExecutable(withGraph ? "ttsc-graph" : "ttsc");
  let needsInstall = force || !(await fileExists(requiredBinary));

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
  }

  if (currentManifest !== desiredManifest) {
    await writeFile(runnerManifestPath, desiredManifest, "utf8");
    needsInstall = true;
  }

  if (!needsInstall) {
    return;
  }

  if (!quiet) {
    console.log(
      `Preparing isolated TS7/ttsc runner in ${runnerRelativePath()}`,
    );
  }

  const proc = Bun.spawn(["bun", "install"], {
    cwd: runnerDir,
    stderr: quiet ? "pipe" : "inherit",
    stdout: quiet ? "pipe" : "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

export async function cleanRunner({ quiet = false }: { quiet?: boolean } = {}) {
  await rm(runnerDir, { force: true, recursive: true });
  if (!quiet) {
    console.log(`Removed ${runnerRelativePath()}`);
  }
}

export function spawnRunner(
  binary: "ttsc" | "ttsc-graph",
  args: string[],
  {
    cwd = runnerDir,
    env,
    stderr = "inherit",
    stdout = "inherit",
  }: SpawnRunnerOptions = {},
) {
  return Bun.spawn(["node", runnerExecutable(binary), ...args], {
    cwd,
    env: runnerEnvironment(env),
    stderr,
    stdout,
  });
}
