import { describe, expect, test } from "bun:test";
import type { FieldCryptoConfig } from "@k-msg/core";
import type { HttpClient } from "../services/webhook.dispatcher";
import {
  type WebhookConfig,
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookEvent,
  WebhookEventType,
} from "../types/webhook.types";
import { WebhookRuntimeService } from "./webhook-runtime.service";
import type { WebhookDeliveryStore, WebhookEndpointStore } from "./types";

class RecordingHttpClient implements HttpClient {
  async fetch(): Promise<Response> {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

class RawEndpointStore implements WebhookEndpointStore {
  readonly rows = new Map<string, WebhookEndpoint>();

  async add(endpoint: WebhookEndpoint): Promise<void> {
    this.rows.set(endpoint.id, endpoint);
  }

  async update(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
    this.rows.set(endpointId, endpoint);
  }

  async remove(endpointId: string): Promise<void> {
    this.rows.delete(endpointId);
  }

  async get(endpointId: string): Promise<WebhookEndpoint | null> {
    return this.rows.get(endpointId) ?? null;
  }

  async list(): Promise<WebhookEndpoint[]> {
    return Array.from(this.rows.values());
  }
}

class RawDeliveryStore implements WebhookDeliveryStore {
  readonly rows = new Map<string, WebhookDelivery>();

  async add(delivery: WebhookDelivery): Promise<void> {
    this.rows.set(delivery.id, delivery);
  }

  async list(): Promise<WebhookDelivery[]> {
    return Array.from(this.rows.values());
  }
}

function createConfig(): WebhookConfig {
  return {
    maxRetries: 0,
    retryDelayMs: 10,
    timeoutMs: 500,
    enableSecurity: false,
    enabledEvents: [WebhookEventType.MESSAGE_SENT],
    batchSize: 10,
    batchTimeoutMs: 50,
  };
}

function createEvent(): WebhookEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: WebhookEventType.MESSAGE_SENT,
    timestamp: new Date(),
    data: { ok: true },
    metadata: {},
    version: "1.0",
  };
}

function createCryptoConfig(path: "secret" | "payload"): FieldCryptoConfig {
  return {
    enabled: true,
    failMode: "closed",
    fields: {
      [path]: "encrypt",
    },
    provider: {
      encrypt: async ({ value }) => ({ ciphertext: `enc:${value}` }),
      decrypt: async ({ ciphertext }) => ciphertext.replace(/^enc:/, ""),
      hash: async ({ value }) => `h:${value}`,
    },
  };
}

describe("WebhookRuntimeService field crypto", () => {
  test("encrypts endpoint secret and delivery payload at rest while returning plaintext on read", async () => {
    const endpointStore = new RawEndpointStore();
    const deliveryStore = new RawDeliveryStore();
    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      persistence: {
        endpointStore,
        deliveryStore,
      },
      fieldCrypto: {
        endpoint: createCryptoConfig("secret"),
        delivery: createCryptoConfig("payload"),
      },
      autoStart: false,
      httpClient: new RecordingHttpClient(),
    });

    try {
      const endpoint = await runtime.addEndpoint({
        url: "https://example.com/webhook",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
        secret: "top-secret",
      });

      const rawStoredEndpoint = endpointStore.rows.get(endpoint.id);
      expect(rawStoredEndpoint?.secret).toBe("enc:top-secret");

      const publicEndpoint = await runtime.getEndpoint(endpoint.id);
      expect(publicEndpoint?.secret).toBe("top-secret");

      await runtime.emitSync(createEvent());

      const rawStoredDelivery = Array.from(deliveryStore.rows.values())[0];
      expect(rawStoredDelivery?.payload.startsWith("enc:")).toBe(true);

      const listed = await runtime.listDeliveries({ endpointId: endpoint.id });
      expect(listed[0]?.payload.startsWith("{")).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  });
});
