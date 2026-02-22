import { createStaticKeyResolver } from "../key-resolver";
import type { KeyResolver } from "../types";

export interface EnvKeyResolverOptions {
  env?: Record<string, string | undefined>;
  activeKidEnv?: string;
  decryptKidsEnv?: string;
  fallbackActiveKid?: string;
  fallbackDecryptKids?: readonly string[];
  delimiter?: string;
}

function normalize(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveEnv(
  env: Record<string, string | undefined>,
  key: string,
): string | undefined {
  return normalize(env[key]);
}

function parseKids(raw: string | undefined, delimiter: string): string[] {
  if (!raw) return [];
  return raw
    .split(delimiter)
    .map((item) => normalize(item))
    .filter((item): item is string => Boolean(item));
}

export function createEnvKeyResolver(
  options: EnvKeyResolverOptions = {},
): KeyResolver {
  const envSource =
    options.env ??
    ((typeof process !== "undefined" ? process.env : {}) as Record<
      string,
      string | undefined
    >);
  const delimiter = normalize(options.delimiter) ?? ",";
  const activeKidEnv = options.activeKidEnv ?? "KMSG_ACTIVE_KID";
  const decryptKidsEnv = options.decryptKidsEnv ?? "KMSG_DECRYPT_KIDS";

  const activeKid =
    resolveEnv(envSource, activeKidEnv) ??
    normalize(options.fallbackActiveKid) ??
    "default";
  const decryptKids = [
    activeKid,
    ...parseKids(resolveEnv(envSource, decryptKidsEnv), delimiter),
    ...(options.fallbackDecryptKids ?? []),
  ];

  return createStaticKeyResolver({
    activeKid,
    decryptKids,
  });
}

