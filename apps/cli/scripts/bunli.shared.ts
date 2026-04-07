import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Generator } from "@bunli/generator";

import bunliConfig from "../bunli.config";

export const CLI_ROOT = path.resolve(import.meta.dir, "..");
export const DIST_DIR = path.join(CLI_ROOT, "dist");
export const GENERATED_PATH = path.join(CLI_ROOT, ".bunli", "commands.gen.ts");
export const CLI_ENTRY = resolveFromCliRoot(
  bunliConfig.build?.entry ?? "./src/k-msg.ts",
);
export const COMMANDS_DIR = resolveFromCliRoot(
  bunliConfig.commands?.directory ?? "./src/commands",
);
export const CLI_NAME =
  typeof bunliConfig.name === "string" && bunliConfig.name.length > 0
    ? bunliConfig.name
    : "k-msg";

export type CliBuildTarget = {
  archiveName: string;
  bunTarget: string;
  binaryName: string;
  runtimePackageName: string;
};

const TARGETS: Record<string, CliBuildTarget> = {
  "darwin-arm64": {
    archiveName: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    binaryName: CLI_NAME,
    runtimePackageName: "@opentui/core-darwin-arm64",
  },
  "darwin-x64": {
    archiveName: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    binaryName: CLI_NAME,
    runtimePackageName: "@opentui/core-darwin-x64",
  },
  "linux-arm64": {
    archiveName: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    binaryName: CLI_NAME,
    runtimePackageName: "@opentui/core-linux-arm64",
  },
  "linux-x64": {
    archiveName: "linux-x64",
    bunTarget: "bun-linux-x64",
    binaryName: CLI_NAME,
    runtimePackageName: "@opentui/core-linux-x64",
  },
  "windows-x64": {
    archiveName: "windows-x64",
    bunTarget: "bun-windows-x64",
    binaryName: `${CLI_NAME}.exe`,
    runtimePackageName: "@opentui/core-win32-x64",
  },
};

export const ALL_BUILD_TARGETS = [
  TARGETS["darwin-arm64"],
  TARGETS["darwin-x64"],
  TARGETS["linux-arm64"],
  TARGETS["linux-x64"],
  TARGETS["windows-x64"],
] as const;

export async function runGenerator(): Promise<void> {
  const generator = new Generator({
    entry: CLI_ENTRY,
    directory: COMMANDS_DIR,
    outputFile: GENERATED_PATH,
  });
  const result = await generator.run();
  if (result.status === "error") {
    throw result.error;
  }
}

export function getHostBuildTarget(): CliBuildTarget {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "darwin" && arch === "arm64") return TARGETS["darwin-arm64"];
  if (platform === "darwin" && arch === "x64") return TARGETS["darwin-x64"];
  if (platform === "linux" && arch === "arm64") return TARGETS["linux-arm64"];
  if (platform === "linux" && arch === "x64") return TARGETS["linux-x64"];
  if (platform === "win32" && arch === "x64") return TARGETS["windows-x64"];

  throw new Error(`Unsupported platform/arch: ${platform}/${arch}`);
}

export async function ensureDistDir(): Promise<void> {
  await mkdir(DIST_DIR, { recursive: true });
}

export async function removePath(targetPath: string): Promise<void> {
  await rm(targetPath, { recursive: true, force: true });
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function runCommand(
  cmd: string[],
  options?: {
    cwd?: string;
    env?: Record<string, string | undefined>;
    stdout?: "inherit" | "pipe";
    stderr?: "inherit" | "pipe";
  },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const env = {
    ...process.env,
    ...(options?.env ?? {}),
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete env[key];
    }
  }

  const proc = Bun.spawn(cmd, {
    cwd: options?.cwd ?? CLI_ROOT,
    env,
    stdout: options?.stdout ?? "pipe",
    stderr: options?.stderr ?? "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
    proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
}

export function sanitizedCliEnv(
  baseEnv: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const env = { ...baseEnv };
  for (const key of Object.keys(env)) {
    if (
      key === "CLAUDECODE" ||
      key === "CURSOR_AGENT" ||
      key.startsWith("CODEX_") ||
      key.startsWith("MCP_")
    ) {
      delete env[key];
    }
  }
  return env as Record<string, string>;
}

function resolveFromCliRoot(relativePath: string): string {
  return path.resolve(CLI_ROOT, relativePath);
}
