import {
  createAesGcmFieldCryptoProvider,
  createEnvKeyResolver,
  type FieldMode,
} from "@k-msg/core";
import type { DeliveryTrackingFieldCryptoOptions } from "@k-msg/messaging/adapters/cloudflare";

export const FIELD_CRYPTO_KEYS_ENV = "KMSG_FIELD_CRYPTO_KEYS";
export const FIELD_CRYPTO_HASH_KEYS_ENV = "KMSG_FIELD_CRYPTO_HASH_KEYS";
export const FIELD_CRYPTO_FIELDS_ENV = "KMSG_FIELD_CRYPTO_FIELDS";
export const FIELD_CRYPTO_TENANT_ENV = "KMSG_FIELD_CRYPTO_TENANT_ID";

const FIELD_MODES: readonly FieldMode[] = [
  "plain",
  "mask",
  "encrypt",
  "encrypt+hash",
];

function parseJsonObject(
  raw: string | undefined,
  name: string,
): Record<string, unknown> | undefined {
  if (raw === undefined || raw.trim().length === 0) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${name} must be a JSON object`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

function parseKeyMap(
  raw: string | undefined,
  name: string,
): Record<string, string> | undefined {
  const parsed = parseJsonObject(raw, name);
  if (!parsed) return undefined;
  const entries = Object.entries(parsed);
  if (
    entries.length === 0 ||
    entries.some(([, value]) => typeof value !== "string" || value.length === 0)
  ) {
    throw new Error(`${name} must map each key id to a base64url key`);
  }
  return Object.fromEntries(entries) as Record<string, string>;
}

// The provider decodes keys leniently and only when it first encrypts, so a
// truncated key would otherwise surface mid-backfill or as AES-128 labeled
// A256GCM. Decode strictly up front.
function assertKeyMaterial(
  keys: Record<string, string>,
  name: string,
  expectedBytes?: number,
): void {
  for (const [kid, value] of Object.entries(keys)) {
    const bytes = /^[A-Za-z0-9_-]+$/.test(value)
      ? Buffer.from(value, "base64url").length
      : 0;
    if (
      bytes === 0 ||
      (expectedBytes !== undefined && bytes !== expectedBytes)
    ) {
      throw new Error(
        `${name}.${kid} must be a base64url key${expectedBytes ? ` of ${expectedBytes} bytes` : ""}`,
      );
    }
  }
}

function parseFields(
  raw: string | undefined,
): Record<string, FieldMode> | undefined {
  const parsed = parseJsonObject(raw, FIELD_CRYPTO_FIELDS_ENV);
  if (!parsed) return undefined;
  if (Object.keys(parsed).length === 0) {
    throw new Error(
      `${FIELD_CRYPTO_FIELDS_ENV} must map at least one field path to a mode`,
    );
  }
  for (const [path, mode] of Object.entries(parsed)) {
    if (!FIELD_MODES.includes(mode as FieldMode)) {
      throw new Error(
        `${FIELD_CRYPTO_FIELDS_ENV}.${path} must be one of ${FIELD_MODES.join(", ")}`,
      );
    }
  }
  return parsed as Record<string, FieldMode>;
}

/**
 * Builds the field crypto options the migration backfill encrypts with,
 * using the default AES-256-GCM provider and keys from the environment.
 *
 * The values must match the tracking store's configuration, or migrated rows
 * will not decrypt or match hash lookups.
 */
export async function resolveMigrationFieldCrypto(
  env: Record<string, string | undefined>,
): Promise<DeliveryTrackingFieldCryptoOptions> {
  const keys = parseKeyMap(env[FIELD_CRYPTO_KEYS_ENV], FIELD_CRYPTO_KEYS_ENV);
  if (!keys) {
    throw new Error(
      `Set ${FIELD_CRYPTO_KEYS_ENV} (a JSON object of base64url AES-256 keys by kid) and KMSG_ACTIVE_KID so the backfill can encrypt with the tracking store's keys.`,
    );
  }

  assertKeyMaterial(keys, FIELD_CRYPTO_KEYS_ENV, 32);

  // The core resolver falls back to the kid "default"; a backfill must use the
  // store's declared active kid instead.
  if (!env.KMSG_ACTIVE_KID?.trim()) {
    throw new Error(
      "Set KMSG_ACTIVE_KID to the tracking store's active kid so the backfill encrypts with the right key.",
    );
  }
  const keyResolver = createEnvKeyResolver({ env });
  const { kid: activeKid } = await keyResolver.resolveEncryptKey({});
  if (!Object.hasOwn(keys, activeKid)) {
    throw new Error(
      `${FIELD_CRYPTO_KEYS_ENV} has no key for the active kid "${activeKid}" (KMSG_ACTIVE_KID)`,
    );
  }

  const hashKeys = parseKeyMap(
    env[FIELD_CRYPTO_HASH_KEYS_ENV],
    FIELD_CRYPTO_HASH_KEYS_ENV,
  );
  if (hashKeys) {
    assertKeyMaterial(hashKeys, FIELD_CRYPTO_HASH_KEYS_ENV);
  }
  const tenantId = env[FIELD_CRYPTO_TENANT_ENV]?.trim();

  return {
    config: {
      enabled: true,
      // Mirrors the tracking store's defaults (DEFAULT_TO_MODE and
      // DEFAULT_FROM_MODE in @k-msg/messaging's delivery-tracking/field-crypto).
      fields: parseFields(env[FIELD_CRYPTO_FIELDS_ENV]) ?? {
        to: "encrypt+hash",
        from: "encrypt+hash",
      },
      keyResolver,
      provider: createAesGcmFieldCryptoProvider({
        keys,
        activeKid,
        ...(hashKeys ? { hashKeys } : {}),
      }),
    },
    ...(tenantId ? { tenantId } : {}),
  };
}
