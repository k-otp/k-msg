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
  WebhookRuntimeFieldCryptoOptions,
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

export async function revealFieldValue(
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
    const tenantAad = withTenant(input.aad, input.tenantId);
    if (tenantAad === input.aad) return await decrypt(input.aad);
    try {
      return await decrypt(tenantAad);
    } catch (error) {
      // Values written before tenant binding carry the legacy AAD.
      try {
        return await decrypt(input.aad);
      } catch {
        throw error;
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

async function protectEndpoint(
  endpoint: WebhookEndpoint,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookEndpoint> {
  const aad = {
    tableName: "webhook_endpoint",
    messageId: endpoint.id,
  };
  const secret = await protectFieldValue(options?.endpoint, {
    value: endpoint.secret,
    path: "secret",
    aad,
    tenantId: options?.tenantId,
  });

  return {
    ...endpoint,
    ...(secret ? { secret } : {}),
  };
}

async function revealEndpoint(
  endpoint: WebhookEndpoint,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookEndpoint> {
  const aad = {
    tableName: "webhook_endpoint",
    messageId: endpoint.id,
  };
  const secret = await revealFieldValue(options?.endpoint, {
    value: endpoint.secret,
    path: "secret",
    aad,
    tenantId: options?.tenantId,
  });

  return {
    ...endpoint,
    ...(secret ? { secret } : {}),
  };
}

async function protectDelivery(
  delivery: WebhookDelivery,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookDelivery> {
  const aad = {
    tableName: "webhook_delivery",
    messageId: delivery.id,
    providerId: delivery.endpointId,
  };
  const payload = await protectFieldValue(options?.delivery, {
    value: delivery.payload,
    path: "payload",
    aad,
    tenantId: options?.tenantId,
  });

  return {
    ...delivery,
    payload: payload ?? delivery.payload,
  };
}

async function revealDelivery(
  delivery: WebhookDelivery,
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): Promise<WebhookDelivery> {
  const aad = {
    tableName: "webhook_delivery",
    messageId: delivery.id,
    providerId: delivery.endpointId,
  };
  const payload = await revealFieldValue(options?.delivery, {
    value: delivery.payload,
    path: "payload",
    aad,
    tenantId: options?.tenantId,
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
  };
}
