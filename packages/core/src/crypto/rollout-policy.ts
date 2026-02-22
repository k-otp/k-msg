import type { FieldCryptoKeyContext } from "./types";

export interface ActiveKidRolloutBucket {
  kid: string;
  percentage: number;
}

export interface ActiveKidRolloutPolicy {
  /**
   * Rollout targets in priority order.
   * Example: [{ kid: "k-2026-02", percentage: 25 }]
   */
  buckets: readonly ActiveKidRolloutBucket[];
  /**
   * Deterministic hash seed.
   */
  seed?: string;
  /**
   * Context keys used to build sticky rollout identity.
   */
  stickyFields?: readonly (keyof FieldCryptoKeyContext)[];
  /**
   * Fallback kid when no bucket matches.
   */
  defaultKid?: string;
}

const DEFAULT_STICKY_FIELDS: readonly (keyof FieldCryptoKeyContext)[] = [
  "tenantId",
  "providerId",
  "messageId",
];

function normalizeKid(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toUnitPercentage(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value <= 0 || value > 100) return undefined;
  return value;
}

function sanitizeBuckets(
  buckets: readonly ActiveKidRolloutBucket[],
): ActiveKidRolloutBucket[] {
  const next: ActiveKidRolloutBucket[] = [];
  for (const bucket of buckets) {
    const kid = normalizeKid(bucket.kid);
    const percentage = toUnitPercentage(bucket.percentage);
    if (!kid || percentage === undefined) continue;
    next.push({ kid, percentage });
  }
  return next;
}

function toStickyKey(
  context: FieldCryptoKeyContext,
  fields: readonly (keyof FieldCryptoKeyContext)[],
  seed: string,
): string {
  const payload = fields
    .map((field) => {
      const value = context[field];
      return typeof value === "string" ? value : "";
    })
    .join("|");
  return `${seed}::${payload}`;
}

/**
 * Deterministic FNV-1a 32-bit hash.
 */
function hash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function resolveBucketKid(
  buckets: readonly ActiveKidRolloutBucket[],
  percentile: number,
): string | undefined {
  let cursor = 0;
  for (const bucket of buckets) {
    cursor += bucket.percentage;
    if (percentile < cursor) {
      return bucket.kid;
    }
  }
  return undefined;
}

export function selectActiveKidByRollout(
  context: FieldCryptoKeyContext,
  policy: ActiveKidRolloutPolicy,
  fallbackKid?: string,
): string | undefined {
  const buckets = sanitizeBuckets(policy.buckets);
  const defaultKid = normalizeKid(policy.defaultKid) ?? normalizeKid(fallbackKid);

  if (buckets.length === 0) {
    return defaultKid;
  }

  const seed = normalizeKid(policy.seed) ?? "kmsg-rollout-v1";
  const stickyFields = policy.stickyFields ?? DEFAULT_STICKY_FIELDS;
  const stickyKey = toStickyKey(context, stickyFields, seed);
  const percentile = hash32(stickyKey) % 100;
  return resolveBucketKid(buckets, percentile) ?? defaultKid;
}

export function getRolloutKnownKids(
  policy: ActiveKidRolloutPolicy,
): readonly string[] {
  return sanitizeBuckets(policy.buckets).map((bucket) => bucket.kid);
}

