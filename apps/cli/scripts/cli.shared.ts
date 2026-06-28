import { access, mkdir, rm } from "node:fs/promises";
import path from "node:path";

export const CLI_ROOT = path.resolve(import.meta.dir, "..");
export const DIST_DIR = path.join(CLI_ROOT, "dist");
export const CLI_ENTRY = path.join(CLI_ROOT, "src", "k-msg.ts");
export const CLI_NAME = "k-msg";

export type CliBuildTarget = {
  archiveName: string;
  binaryName: string;
  bunTarget: string;
};

const TARGETS: Record<string, CliBuildTarget> = {
  "darwin-arm64": {
    archiveName: "darwin-arm64",
    binaryName: CLI_NAME,
    bunTarget: "bun-darwin-arm64",
  },
  "darwin-x64": {
    archiveName: "darwin-x64",
    binaryName: CLI_NAME,
    bunTarget: "bun-darwin-x64",
  },
  "linux-arm64": {
    archiveName: "linux-arm64",
    binaryName: CLI_NAME,
    bunTarget: "bun-linux-arm64",
  },
  "linux-x64": {
    archiveName: "linux-x64",
    binaryName: CLI_NAME,
    bunTarget: "bun-linux-x64",
  },
  "windows-x64": {
    archiveName: "windows-x64",
    binaryName: `${CLI_NAME}.exe`,
    bunTarget: "bun-windows-x64",
  },
};

export const ALL_BUILD_TARGETS = [
  TARGETS["darwin-arm64"],
  TARGETS["darwin-x64"],
  TARGETS["linux-arm64"],
  TARGETS["linux-x64"],
  TARGETS["windows-x64"],
] as const;

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
  await rm(targetPath, { force: true, recursive: true });
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
    stderr?: "inherit" | "pipe";
    stdout?: "inherit" | "pipe";
  },
): Promise<{ exitCode: number; stderr: string; stdout: string }> {
  const envSource = options?.env ?? process.env;
  const env = { ...envSource };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete env[key];
    }
  }

  const proc = Bun.spawn(cmd, {
    cwd: options?.cwd ?? CLI_ROOT,
    env,
    stderr: options?.stderr ?? "pipe",
    stdout: options?.stdout ?? "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
    proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
    proc.exited,
  ]);

  return {
    exitCode,
    stderr,
    stdout,
  };
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
