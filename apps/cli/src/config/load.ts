import os from "node:os";
import path from "node:path";
import { type KMsgCliConfig, kMsgCliConfigSchema } from "./schema";

export type LoadedKMsgConfig = {
  path: string;
  config: KMsgCliConfig;
};

type ConfigPathResolveOptions = {
  platform?: NodeJS.Platform;
  env?: Record<string, string | undefined>;
  cwd?: string;
  homeDir?: string;
};

const DEFAULT_CONFIG_FILE_NAME = "k-msg.config.json";
const DEFAULT_CONFIG_DIR_NAME = "k-msg";

function getResolveContext(
  options?: ConfigPathResolveOptions,
): Required<ConfigPathResolveOptions> {
  return {
    platform: options?.platform ?? process.platform,
    env:
      options?.env ??
      (Bun.env as unknown as Record<string, string | undefined>),
    cwd: options?.cwd ?? process.cwd(),
    homeDir: options?.homeDir ?? os.homedir(),
  };
}

function normalizeEnvPath(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveHomeConfigBaseDir(
  options?: ConfigPathResolveOptions,
): string {
  const ctx = getResolveContext(options);
  if (ctx.platform === "win32") {
    return (
      normalizeEnvPath(ctx.env.APPDATA) ??
      path.join(ctx.homeDir, "AppData", "Roaming")
    );
  }
  return (
    normalizeEnvPath(ctx.env.XDG_CONFIG_HOME) ??
    path.join(ctx.homeDir, ".config")
  );
}

export function resolveDefaultConfigPath(
  options?: ConfigPathResolveOptions,
): string {
  const baseDir = resolveHomeConfigBaseDir(options);
  return path.join(baseDir, DEFAULT_CONFIG_DIR_NAME, DEFAULT_CONFIG_FILE_NAME);
}

export function resolveLegacyCwdConfigPath(
  options?: ConfigPathResolveOptions,
): string {
  const ctx = getResolveContext(options);
  return path.resolve(ctx.cwd, DEFAULT_CONFIG_FILE_NAME);
}

function resolveExplicitConfigPath(inputPath: string): string {
  if (typeof inputPath === "string" && inputPath.trim().length > 0) {
    return path.isAbsolute(inputPath) ? inputPath : path.resolve(inputPath);
  }
  return inputPath;
}

async function pathExists(targetPath: string): Promise<boolean> {
  return Bun.file(targetPath).exists();
}

export async function resolveConfigPathForRead(
  inputPath: string | undefined,
  options?: ConfigPathResolveOptions,
): Promise<string> {
  if (typeof inputPath === "string" && inputPath.trim().length > 0) {
    return resolveExplicitConfigPath(inputPath);
  }

  const preferred = resolveDefaultConfigPath(options);
  if (await pathExists(preferred)) return preferred;

  const legacy = resolveLegacyCwdConfigPath(options);
  if (await pathExists(legacy)) return legacy;

  return preferred;
}

export async function resolveConfigPathForWrite(
  inputPath: string | undefined,
  options?: ConfigPathResolveOptions,
): Promise<string> {
  if (typeof inputPath === "string" && inputPath.trim().length > 0) {
    return resolveExplicitConfigPath(inputPath);
  }

  const preferred = resolveDefaultConfigPath(options);
  if (await pathExists(preferred)) return preferred;

  const legacy = resolveLegacyCwdConfigPath(options);
  if (await pathExists(legacy)) return legacy;

  return preferred;
}

export async function resolveConfigPath(
  inputPath: string | undefined,
): Promise<string> {
  return resolveConfigPathForWrite(inputPath);
}

function substituteEnvValues(
  value: unknown,
  pathParts: string[] = [],
): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("env:")) return value;
    const key = trimmed.slice("env:".length).trim();
    if (key.length === 0) return value;

    const resolved = (Bun.env as Record<string, string | undefined>)[key];
    if (resolved === undefined || resolved.trim().length === 0) {
      const at = pathParts.length > 0 ? ` at ${pathParts.join(".")}` : "";
      throw new Error(`Missing environment variable: ${key}${at}`);
    }
    return resolved;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      substituteEnvValues(item, [...pathParts, String(index)]),
    );
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = substituteEnvValues(v, [...pathParts, k]);
    }
    return out;
  }

  return value;
}

export async function loadKMsgConfig(
  configPath?: string,
): Promise<LoadedKMsgConfig> {
  const resolved = await resolveConfigPathForRead(configPath);
  const file = Bun.file(resolved);
  if (!(await file.exists())) {
    throw new Error(`Config file not found: ${resolved}`);
  }

  const raw = await file.text();
  let parsed: unknown;
  try {
    parsed = raw.trim().length > 0 ? JSON.parse(raw) : {};
  } catch (error) {
    throw new Error(
      `Failed to parse config JSON (${resolved}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const config = kMsgCliConfigSchema.parse(parsed);
  return { path: resolved, config };
}

export function resolveKMsgConfigEnv(config: KMsgCliConfig): KMsgCliConfig {
  const substituted = substituteEnvValues(config);
  return kMsgCliConfigSchema.parse(substituted);
}
