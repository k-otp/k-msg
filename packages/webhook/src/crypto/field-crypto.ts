import {
  assertFieldCryptoConfig,
  createDefaultMasker,
  type FieldCryptoConfig,
  FieldCryptoError,
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
  const fallback = config.openFallback ?? "masked";
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

async function protectValue(
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

  const failMode = config.failMode ?? "closed";
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
      aad: input.aad,
      ...(kid ? { kid } : {}),
    });
    return typeof encrypted.ciphertext === "string"
      ? encrypted.ciphertext
      : JSON.stringify(encrypted.ciphertext);
  } catch (error) {
    if (failMode === "closed") {
      throw error;
    }
    return toFallbackValue(config, value);
  }
}

async function revealValue(
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

  const failMode = config.failMode ?? "closed";

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

    return await config.provider.decrypt({
      ciphertext: value,
      path: input.path,
      aad: input.aad,
      ...(Array.isArray(candidateKids) && candidateKids.length > 0
        ? { candidateKids }
        : {}),
    });
  } catch (error) {
    if (failMode === "closed") {
      throw error;
    }
    return toFallbackValue(config, value);
  }
}

export function validateWebhookFieldCryptoOptions(
  options: WebhookRuntimeFieldCryptoOptions | undefined,
): void {
  if (!options) return;
  if (options.endpoint) {
    assertFieldCryptoConfig(options.endpoint);
  }
  if (options.delivery) {
    assertFieldCryptoConfig(options.delivery);
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
  const secret = await protectValue(options?.endpoint, {
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
  const secret = await revealValue(options?.endpoint, {
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
  const payload = await protectValue(options?.delivery, {
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
  const payload = await revealValue(options?.delivery, {
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
