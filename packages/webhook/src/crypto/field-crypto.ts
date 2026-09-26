import {
  assertFieldCryptoConfig,
  createDefaultMasker,
  type FieldCryptoConfig,
  FieldCryptoError,
  type FieldMode,
  resolveFieldCryptoFailMode,
  resolveFieldCryptoOpenFallback,
  toCiphertextEnvelopeString,
} from "@k-msg/core";
import type {
  WebhookDeliveryListOptions,
  WebhookDeliveryStore,
  WebhookEndpointStore,
  WebhookPersistence,
  WebhookRuntimeFieldCryptoOptions,
  WebhookTenantMigrationResult,
} from "../runtime/types";
import type { WebhookDelivery, WebhookEndpoint } from "../types/webhook.types";

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toFallbackValue(config: FieldCryptoConfig, plaintext: string): string {
  const fallback = resolveFieldCryptoOpenFallback(config);
  if (fallback === "plaintext") {
    if (!config.unsafeAllowPlaintextStorage) {
      throw new FieldCryptoError(
        "policy",
        "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
        {
          rule: "fieldCrypto.fail_open.plaintext_guard",
          path: "openFallback",
        },
        {
          fieldPath: "openFallback",
          failMode: "open",
          openFallback: "plaintext",
        },
      );
    }
    return plaintext;
  }

  if (fallback === "null") {
    return "";
  }

  return createDefaultMasker()(plaintext);
}

// Name the field in a fail-closed error, since this storage encrypts both the
// endpoint secret and the delivery payload. Provider and key resolver errors
// are wrapped; a FieldCryptoError keeps its kind and metadata.
function withFieldPath(
  error: unknown,
  path: string,
  kind: "encrypt" | "decrypt",
): FieldCryptoError {
  if (error instanceof FieldCryptoError) {
    if (error.fieldPath) return error;
    return new FieldCryptoError(error.kind, error.message, error.details, {
      providerErrorCode: error.providerErrorCode,
      providerErrorText: error.providerErrorText,
      httpStatus: error.httpStatus,
      requestId: error.requestId,
      retryAfterMs: error.retryAfterMs,
      attempt: error.attempt,
      openFallback: error.openFallback,
      fieldPath: path,
      failMode: "closed",
      causeChain: [error],
    });
  }
  return new FieldCryptoError(
    kind,
    `Field crypto ${kind} failed for ${path}`,
    { cause: error instanceof Error ? error.message : String(error) },
    { fieldPath: path, failMode: "closed", causeChain: [error] },
  );
}

// Binds ciphertext to the tenant when one is configured, so a value copied
// between tenants' rows with the same id does not decrypt.
function withTenant(
  aad: Record<string, string>,
  tenantId: string | undefined,
): Record<string, string> {
  return tenantId ? { ...aad, tenantId } : aad;
}

// Shared by the runtime store wrappers and WebhookRegistry.
export async function protectFieldValue(
  config: FieldCryptoConfig | undefined,
  input: {
    value: string | undefined;
    path: string;
    aad: Record<string, string>;
    tenantId?: string;
  },
): Promise<string | undefined> {
  const value = normalizeString(input.value);
  if (!value) return undefined;
  if (!config || config.enabled === false) return value;

  const failMode = resolveFieldCryptoFailMode(config);
  const keyResolver = config.keyResolver;

  try {
    const keyContext = {
      tenantId: input.tenantId,
      tableName: input.aad.tableName,
      fieldPath: input.path,
      messageId: input.aad.messageId,
      providerId: input.aad.providerId,
    };
    const key = keyResolver
      ? await keyResolver.resolveEncryptKey(keyContext)
      : undefined;
    const kid = normalizeString(key?.kid);
    const encrypted = await config.provider.encrypt({
      value,
      path: input.path,
      aad: withTenant(input.aad, input.tenantId),
      ...(kid ? { kid } : {}),
    });
    return toCiphertextEnvelopeString(encrypted.ciphertext);
  } catch (error) {
    if (failMode === "closed") {
      throw withFieldPath(error, input.path, "encrypt");
    }
    return toFallbackValue(config, value);
  }
}

/**
 * @evidence docs/security/field-crypto-v1.md#threat-model
 *   Decrypts with the tenant-bound AAD, falling back to the tenant-less AAD
 *   only when acceptLegacyAad is set, as migrateWebhookFieldCryptoToTenant
 *   does to re-encrypt values written before tenant binding.
 * @evidenceReview docs/security/field-crypto-v1.md#threat-model #98761bf
 *   Read revealFieldValue and migrateWebhookFieldCryptoToTenant, and ran
 *   field-crypto.test.ts: a tenant-less value is rejected by default and
 *   read with acceptLegacyAad, and the migration re-encrypts it with the
 *   tenant, from the runtime too, stopping at a value neither AAD decrypts
 *   instead of storing a fallback.
 */
export async function revealFieldValue(
  config: FieldCryptoConfig | undefined,
  input: {
    value: string | undefined;
    path: string;
    aad: Record<string, string>;
    tenantId?: string;
    acceptLegacyAad?: boolean;
  },
): Promise<string | undefined> {
  const value = normalizeString(input.value);
  if (!value) return undefined;
  if (!config || config.enabled === false) return value;

  const failMode = resolveFieldCryptoFailMode(config);

  try {
    const keyContext = {
      tenantId: input.tenantId,
      tableName: input.aad.tableName,
      fieldPath: input.path,
      messageId: input.aad.messageId,
      providerId: input.aad.providerId,
    };
    const candidateKids = config.keyResolver?.resolveDecryptKeys
      ? await config.keyResolver.resolveDecryptKeys({
          ...keyContext,
          ciphertext: value,
        })
      : undefined;

    const decrypt = (aad: Record<string, string>) =>
      config.provider.decrypt({
        ciphertext: value,
        path: input.path,
        aad,
        ...(Array.isArray(candidateKids) && candidateKids.length > 0
          ? { candidateKids }
          : {}),
      });
    if (!input.tenantId) return await decrypt(input.aad);
    if (!input.acceptLegacyAad) {
      return await decrypt(withTenant(input.aad, input.tenantId));
    }
    try {
      return await decrypt(withTenant(input.aad, input.tenantId));
    } catch (error) {
      // Values written before tenant binding carry the legacy AAD. They are
      // read only while a migration re-encrypts them with the tenant.
      try {
        return await decrypt(input.aad);
      } catch (legacyError) {
        throw new AggregateError(
          [error, legacyError],
          "decrypt failed with both the tenant-bound and the legacy AAD",
        );
      }
    }
  } catch (error) {
    if (failMode === "closed") {
      throw withFieldPath(error, input.path, "decrypt");
    }
    return toFallbackValue(config, value);
  }
}

// Webhook storage always encrypts the endpoint secret and the delivery
// payload, which must stay recoverable to sign and resend, and stores no
// lookup hash for them. Only the encrypt modes describe that.
const WEBHOOK_FIELD_MODES: readonly FieldMode[] = ["encrypt", "encrypt+hash"];

function assertWebhookFieldMode(
  config: FieldCryptoConfig,
  path: "secret" | "payload",
): void {
  if (config.enabled === false) return;
  const mode = config.fields[path];
  if (mode !== undefined && WEBHOOK_FIELD_MODES.includes(mode)) return;
  throw new FieldCryptoError(
    "config",
    mode === undefined
      ? `webhook storage always encrypts ${path}; set fields.${path} to "encrypt" or "encrypt+hash"`
      : `webhook storage always encrypts ${path}; fields.${path} must be "encrypt" or "encrypt+hash", not "${mode}"`,
    { rule: "fieldCrypto.webhook.encrypt_only", path: `fields.${path}` },
    { fieldPath: `fields.${path}` },
  );
}

/**
 * @evidence docs/security/field-crypto-v1.md#field-policy-modes
 *   Accepts only encrypt and encrypt+hash for the endpoint secret and the
 *   delivery payload, which the storage always encrypts.
 * @evidenceReview docs/security/field-crypto-v1.md#field-policy-modes #d6936dd
 *   Read assertWebhookFieldMode and protectFieldValue, which encrypts
 *   whenever crypto is enabled and stores no hash, and ran
 *   webhook.registry.crypto.test.ts, which rejects a missing, plain, or mask
 *   mode for secret and payload and accepts both encrypt modes.
 */
export function validateWebhookFieldCryptoOptions(
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): void {
  if (!options) return;
  if (options.endpoint) {
    assertFieldCryptoConfig(options.endpoint);
    assertWebhookFieldMode(options.endpoint, "secret");
  }
  if (options.delivery) {
    assertFieldCryptoConfig(options.delivery);
    assertWebhookFieldMode(options.delivery, "payload");
  }
}

// Applies a protected or revealed secret. An empty one is the null fallback,
// so the endpoint keeps no secret rather than the one it came with, which on
// a write is the plaintext.
function withSecret(
  endpoint: WebhookEndpoint,
  secret: string | undefined,
): WebhookEndpoint {
  if (secret === undefined) return endpoint;
  if (secret) return { ...endpoint, secret };
  const next = { ...endpoint };
  delete next.secret;
  return next;
}

function endpointAad(endpoint: WebhookEndpoint): Record<string, string> {
  return { tableName: "webhook_endpoint", messageId: endpoint.id };
}

function deliveryAad(delivery: WebhookDelivery): Record<string, string> {
  return {
    tableName: "webhook_delivery",
    messageId: delivery.id,
    providerId: delivery.endpointId,
  };
}

// The endpoint and delivery helpers below are shared by the runtime store
// wrappers and WebhookRegistry.
export async function protectEndpoint(
  endpoint: WebhookEndpoint,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookEndpoint> {
  const secret = await protectFieldValue(options?.endpoint, {
    value: endpoint.secret,
    path: "secret",
    aad: endpointAad(endpoint),
    tenantId: options?.tenantId,
  });

  return withSecret(endpoint, secret);
}

export async function revealEndpoint(
  endpoint: WebhookEndpoint,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookEndpoint> {
  const secret = await revealFieldValue(options?.endpoint, {
    value: endpoint.secret,
    path: "secret",
    aad: endpointAad(endpoint),
    tenantId: options?.tenantId,
    acceptLegacyAad: options?.acceptLegacyAad,
  });

  return withSecret(endpoint, secret);
}

export async function protectDelivery(
  delivery: WebhookDelivery,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookDelivery> {
  const payload = await protectFieldValue(options?.delivery, {
    value: delivery.payload,
    path: "payload",
    aad: deliveryAad(delivery),
    tenantId: options?.tenantId,
  });

  return {
    ...delivery,
    payload: payload ?? delivery.payload,
  };
}

export async function revealDelivery(
  delivery: WebhookDelivery,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookDelivery> {
  const payload = await revealFieldValue(options?.delivery, {
    value: delivery.payload,
    path: "payload",
    aad: deliveryAad(delivery),
    tenantId: options?.tenantId,
    acceptLegacyAad: options?.acceptLegacyAad,
  });

  return {
    ...delivery,
    payload: payload ?? delivery.payload,
  };
}

export function wrapWebhookEndpointStoreWithFieldCrypto(
  store: WebhookEndpointStore,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): WebhookEndpointStore {
  if (!options?.endpoint) {
    return store;
  }

  return {
    async add(endpoint: WebhookEndpoint): Promise<void> {
      await store.add(await protectEndpoint(endpoint, options));
    },
    async update(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
      await store.update(endpointId, await protectEndpoint(endpoint, options));
    },
    async remove(endpointId: string): Promise<void> {
      await store.remove(endpointId);
    },
    async get(endpointId: string): Promise<WebhookEndpoint | null> {
      const endpoint = await store.get(endpointId);
      if (!endpoint) return null;
      return await revealEndpoint(endpoint, options);
    },
    async list(): Promise<WebhookEndpoint[]> {
      const endpoints = await store.list();
      return await Promise.all(
        endpoints.map((endpoint) => revealEndpoint(endpoint, options)),
      );
    },
  };
}

export function wrapWebhookDeliveryStoreWithFieldCrypto(
  store: WebhookDeliveryStore,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): WebhookDeliveryStore {
  if (!options?.delivery) {
    return store;
  }

  const replace = store.replace?.bind(store);
  return {
    async add(delivery: WebhookDelivery): Promise<void> {
      await store.add(await protectDelivery(delivery, options));
    },
    async list(
      listOptions?: WebhookDeliveryListOptions,
    ): Promise<WebhookDelivery[]> {
      const deliveries = await store.list(listOptions);
      return await Promise.all(
        deliveries.map((delivery) => revealDelivery(delivery, options)),
      );
    },
    ...(replace
      ? {
          async replace(delivery: WebhookDelivery): Promise<void> {
            await replace(await protectDelivery(delivery, options));
          },
        }
      : {}),
  };
}

// Lists every delivery: the built-in stores return 100 when no limit is set.
const ALL_DELIVERIES = Number.MAX_SAFE_INTEGER;

function failClosed(
  config: FieldCryptoConfig | undefined,
): FieldCryptoConfig | undefined {
  return config ? { ...config, failMode: "closed" } : undefined;
}

// Whether a stored value already reads with the tenant-bound AAD. A value the
// tenant AAD cannot decrypt is a legacy value, or unreadable, which the
// legacy read that follows reports.
async function isTenantBound(
  config: FieldCryptoConfig,
  input: {
    value: string | undefined;
    path: string;
    aad: Record<string, string>;
    tenantId: string;
  },
): Promise<boolean> {
  try {
    await revealFieldValue(config, input);
    return true;
  } catch {
    return false;
  }
}

// Reads a value the tenant AAD could not, naming the record if the legacy AAD
// cannot either. The cause may also be an outage, so the message does not
// claim the value is corrupt.
async function revealLegacy<T>(
  reveal: () => Promise<T>,
  kind: "endpoint" | "delivery",
  id: string,
  path: "secret" | "payload",
): Promise<T> {
  try {
    return await reveal();
  } catch (error) {
    throw new FieldCryptoError(
      "decrypt",
      `Cannot migrate webhook ${kind} ${id}: its ${path} could not be read with the tenant-bound or the legacy AAD (see causeChain)`,
      { recordId: id },
      { fieldPath: path, failMode: "closed", causeChain: [error] },
    );
  }
}

/**
 * Re-encrypts endpoint secrets and delivery payloads written before
 * ciphertext was bound to `options.tenantId`, so they read without
 * `acceptLegacyAad`. Pass the stores the runtime persists to, not wrapped
 * ones. Values already bound to the tenant are left as they are. The
 * migration runs fail-closed whatever `failMode` says, so a value that
 * cannot be read with either AAD stops it rather than being replaced by a
 * fallback. Each endpoint is read again just before it is rewritten, but
 * pause endpoint updates while it runs: one landing in between would be
 * overwritten. Deliveries, which the runtime never rewrites, are listed
 * without a limit and written back with the delivery store's `replace()`,
 * which a custom store must implement for the migration to run.
 */
export async function migrateWebhookFieldCryptoToTenant(
  persistence: Pick<WebhookPersistence, "endpointStore" | "deliveryStore">,
  options: WebhookRuntimeFieldCryptoOptions,
): Promise<WebhookTenantMigrationResult> {
  validateWebhookFieldCryptoOptions(options);
  const tenantId = normalizeString(options.tenantId);
  if (!tenantId) {
    throw new FieldCryptoError(
      "config",
      "migrating webhook ciphertext to the tenant requires fieldCrypto.tenantId",
      { rule: "fieldCrypto.webhook.tenant_migration", path: "tenantId" },
      { fieldPath: "tenantId" },
    );
  }

  const deliveryStore = persistence.deliveryStore;
  const replaceDelivery = deliveryStore.replace?.bind(deliveryStore);
  const migratesDeliveries =
    options.delivery !== undefined && options.delivery.enabled !== false;
  if (migratesDeliveries && !replaceDelivery) {
    // Checked first, so a store that cannot rewrite deliveries does not
    // leave the endpoints migrated and the deliveries not.
    throw new FieldCryptoError(
      "config",
      "migrating webhook deliveries needs a delivery store with replace(); the built-in stores implement it",
      { rule: "fieldCrypto.webhook.tenant_migration", path: "deliveryStore" },
      { fieldPath: "deliveryStore" },
    );
  }

  const bound: WebhookRuntimeFieldCryptoOptions = {
    tenantId,
    endpoint: failClosed(options.endpoint),
    delivery: failClosed(options.delivery),
  };
  const legacy = { ...bound, acceptLegacyAad: true };
  const result: WebhookTenantMigrationResult = { endpoints: 0, deliveries: 0 };

  const endpointConfig = bound.endpoint;
  if (endpointConfig && endpointConfig.enabled !== false) {
    for (const { id } of await persistence.endpointStore.list()) {
      // Read it again, so an update made since the list is kept and an
      // endpoint removed since is skipped.
      const endpoint = await persistence.endpointStore.get(id);
      if (!endpoint) continue;
      const input = {
        value: endpoint.secret,
        path: "secret",
        aad: endpointAad(endpoint),
        tenantId,
      };
      if (await isTenantBound(endpointConfig, input)) continue;
      const revealed = await revealLegacy(
        () => revealEndpoint(endpoint, legacy),
        "endpoint",
        endpoint.id,
        "secret",
      );
      await persistence.endpointStore.update(
        endpoint.id,
        await protectEndpoint(revealed, bound),
      );
      result.endpoints += 1;
    }
  }

  const deliveryConfig = bound.delivery;
  if (replaceDelivery && deliveryConfig && deliveryConfig.enabled !== false) {
    const deliveries = await deliveryStore.list({
      limit: ALL_DELIVERIES,
    });
    for (const delivery of deliveries) {
      const input = {
        value: delivery.payload,
        path: "payload",
        aad: deliveryAad(delivery),
        tenantId,
      };
      if (await isTenantBound(deliveryConfig, input)) continue;
      const revealed = await revealLegacy(
        () => revealDelivery(delivery, legacy),
        "delivery",
        delivery.id,
        "payload",
      );
      await replaceDelivery(await protectDelivery(revealed, bound));
      result.deliveries += 1;
    }
  }

  return result;
}
