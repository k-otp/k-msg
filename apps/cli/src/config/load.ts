import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { type KMsgCliConfig, kMsgCliConfigSchema } from "./schema";

export type LoadedKMsgConfig = {
  path: string;
  config: KMsgCliConfig;
};

export function resolveConfigPath(inputPath: string | undefined): string {
  if (typeof inputPath === "string" && inputPath.trim().length > 0) {
    return path.isAbsolute(inputPath)
      ? inputPath
      : path.resolve(process.cwd(), inputPath);
  }
  return path.resolve(process.cwd(), "k-msg.config.json");
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

    const resolved = process.env[key];
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

export function loadKMsgConfig(configPath?: string): LoadedKMsgConfig {
  const resolved = resolveConfigPath(configPath);
  if (!existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}`);
  }

  const raw = readFileSync(resolved, "utf8");
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
