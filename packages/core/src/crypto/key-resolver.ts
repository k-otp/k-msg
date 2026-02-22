import {
  getRolloutKnownKids,
  selectActiveKidByRollout,
  type ActiveKidRolloutPolicy,
} from "./rollout-policy";
import type { FieldCryptoKeyContext, KeyResolver, KeySetState } from "./types";

export interface StaticKeyResolverOptions {
  activeKid: string;
  decryptKids?: readonly string[];
}

export interface KeySetStateProvider {
  loadKeySet(context: FieldCryptoKeyContext): Promise<KeySetState>;
}

export interface RefreshableKeyResolverOptions {
  provider: KeySetStateProvider;
  cacheTtlMs?: number;
  fallback?: {
    activeKid?: string;
    decryptKids?: readonly string[];
  };
}

interface CachedKeySetState {
  value: KeySetState;
  expiresAt: number;
}

function normalizeKid(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeKidList(value: readonly string[] | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((kid) => normalizeKid(kid))
    .filter((kid): kid is string => Boolean(kid));
}

function dedupeKids(values: readonly string[]): string[] {
  const next: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = normalizeKid(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }
  return next;
}

function fallbackKidFromContext(context: FieldCryptoKeyContext): string {
  return normalizeKid(context.providerId) ?? "default";
}

export function createStaticKeyResolver(
  options: StaticKeyResolverOptions,
): KeyResolver {
  const activeKid = normalizeKid(options.activeKid) ?? "default";
  const decryptKids = dedupeKids([activeKid, ...normalizeKidList(options.decryptKids)]);

  return {
    async resolveEncryptKey() {
      return { kid: activeKid };
    },
    async resolveDecryptKeys() {
      return decryptKids;
    },
  };
}

export function createRefreshableKeyResolver(
  options: RefreshableKeyResolverOptions,
): KeyResolver {
  const cacheTtlMs =
    typeof options.cacheTtlMs === "number" && options.cacheTtlMs >= 0
      ? Math.trunc(options.cacheTtlMs)
      : 30_000;

  const fallbackActiveKid = normalizeKid(options.fallback?.activeKid);
  const fallbackDecryptKids = normalizeKidList(options.fallback?.decryptKids);
  let cache: CachedKeySetState | undefined;

  async function load(context: FieldCryptoKeyContext): Promise<KeySetState> {
    const now = Date.now();
    if (cache && now < cache.expiresAt) {
      return cache.value;
    }

    const loaded = await options.provider.loadKeySet(context);
    const activeKid =
      normalizeKid(loaded.activeKid) ??
      fallbackActiveKid ??
      fallbackKidFromContext(context);

    const decryptKids = dedupeKids([
      activeKid,
      ...normalizeKidList(loaded.decryptKids),
      ...fallbackDecryptKids,
    ]);

    const next: KeySetState = {
      activeKid,
      decryptKids,
      refreshedAt: Date.now(),
    };
    cache = {
      value: next,
      expiresAt: Date.now() + cacheTtlMs,
    };
    return next;
  }

  return {
    async resolveEncryptKey(context) {
      const state = await load(context);
      return { kid: state.activeKid };
    },
    async resolveDecryptKeys(context) {
      const state = await load(context);
      return state.decryptKids ?? [state.activeKid];
    },
  };
}

export function createRollingKeyResolver(
  baseResolver: KeyResolver,
  policy: ActiveKidRolloutPolicy,
): KeyResolver {
  return {
    async resolveEncryptKey(context) {
      const base = await baseResolver.resolveEncryptKey(context);
      const selected = selectActiveKidByRollout(context, policy, base.kid);
      return {
        kid: selected ?? base.kid,
      };
    },
    async resolveDecryptKeys(context) {
      const baseEncrypt = await baseResolver.resolveEncryptKey(context);
      const baseDecrypt = baseResolver.resolveDecryptKeys
        ? await baseResolver.resolveDecryptKeys(context)
        : [baseEncrypt.kid];
      const selected = selectActiveKidByRollout(context, policy, baseEncrypt.kid);
      const rolloutKids = getRolloutKnownKids(policy);

      return dedupeKids([
        ...(selected ? [selected] : []),
        baseEncrypt.kid,
        ...(baseDecrypt ?? []),
        ...rolloutKids,
      ]);
    },
  };
}

