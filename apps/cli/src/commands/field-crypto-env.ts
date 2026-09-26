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

function parseFields(
  raw: string | undefined,
): Record<string, FieldMode> | undefined {
  const parsed = parseJsonObject(raw, FIELD_CRYPTO_FIELDS_ENV);
  if (!parsed) return undefined;
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

  const keyResolver = createEnvKeyResolver({ env });
  const { kid: activeKid } = await keyResolver.resolveEncryptKey({});
  if (!keys[activeKid]) {
    throw new Error(
      `${FIELD_CRYPTO_KEYS_ENV} has no key for the active kid "${activeKid}" (KMSG_ACTIVE_KID)`,
    );
  }

  const hashKeys = parseKeyMap(
    env[FIELD_CRYPTO_HASH_KEYS_ENV],
    FIELD_CRYPTO_HASH_KEYS_ENV,
  );
  const tenantId = env[FIELD_CRYPTO_TENANT_ENV]?.trim();

  return {
    config: {
      enabled: true,
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
