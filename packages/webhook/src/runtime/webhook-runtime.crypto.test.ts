import { describe, expect, test } from "bun:test";
import {
  createAesGcmFieldCryptoProvider,
  type FieldCryptoConfig,
} from "@k-msg/core";
import { verifyWebhookRequest } from "../security/verify-webhook-request";
import type { HttpClient } from "../services/webhook.dispatcher";
import {
  type WebhookConfig,
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookEvent,
  WebhookEventType,
} from "../types/webhook.types";
import type { WebhookDeliveryStore, WebhookEndpointStore } from "./types";
import { WebhookRuntimeService } from "./webhook-runtime.service";

class RecordingHttpClient implements HttpClient {
  readonly calls: RequestInit[] = [];

  async fetch(_url: string, options: RequestInit): Promise<Response> {
    this.calls.push(options);
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

// Encrypts as `enc:<value>`. Either direction can be switched off, as during a
// key service outage.
function createSwitchableCrypto(patch: Partial<FieldCryptoConfig> = {}) {
  const outage = { encrypt: false, decrypt: false };
  const config: FieldCryptoConfig = {
    enabled: true,
    failMode: "open",
    openFallback: "masked",
    fields: { secret: "encrypt" },
    provider: {
      encrypt: async ({ value }) => {
        if (outage.encrypt) throw new Error("key service unavailable");
        return { ciphertext: `enc:${value}` };
      },
      decrypt: async ({ ciphertext }) => {
        if (outage.decrypt) throw new Error("key service unavailable");
        if (!ciphertext.startsWith("enc:")) throw new Error("not ciphertext");
        return ciphertext.slice("enc:".length);
      },
      hash: async ({ value }) => `h:${value}`,
    },
    ...patch,
  };
  return { config, outage };
}

function createSecureRuntime(
  endpointCrypto: FieldCryptoConfig,
  delivery: Partial<WebhookConfig> = {},
) {
  const endpointStore = new RawEndpointStore();
  const client = new RecordingHttpClient();
  const runtime = new WebhookRuntimeService({
    delivery: { ...createConfig(), enableSecurity: true, ...delivery },
    persistence: { endpointStore, deliveryStore: new RawDeliveryStore() },
    fieldCrypto: { endpoint: endpointCrypto },
    autoStart: false,
    httpClient: client,
  });
  return { runtime, endpointStore, client };
}

function addSignedEndpoint(runtime: WebhookRuntimeService, secret: string) {
  return runtime.addEndpoint({
    url: "https://example.com/webhook",
    active: true,
    events: [WebhookEventType.MESSAGE_SENT],
    secret,
  });
}

function isSignedWith(request: RequestInit | undefined, secret: string) {
  if (!request) return false;
  return verifyWebhookRequest(
    request.headers as Record<string, string>,
    request.body as string,
    secret,
  ).isSuccess;
}

describe("WebhookRuntimeService with an endpoint secret it cannot decrypt", () => {
  test.each(["masked", "null"] as const)(
    "sends nothing instead of signing with the %s fallback",
    async (openFallback) => {
      const { config, outage } = createSwitchableCrypto({ openFallback });
      const { runtime, client } = createSecureRuntime(config);

      try {
        const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
        outage.decrypt = true;

        expect(await runtime.getEndpoint(endpoint.id)).not.toHaveProperty(
          "secret",
        );
        const [delivery] = await runtime.emitSync(createEvent());

        expect(client.calls).toHaveLength(0);
        expect(delivery?.status).toBe("failed");
        expect(delivery?.attempts[0]?.error).toBe(
          `Not sent: enableSecurity is on, but the secret of endpoint ${endpoint.id} could not be decrypted`,
        );
      } finally {
        await runtime.shutdown();
      }
    },
  );

  test("does not sign with the shared secretKey instead", async () => {
    const { config, outage } = createSwitchableCrypto();
    const { runtime, client } = createSecureRuntime(config, {
      secretKey: "whsec_shared",
    });

    try {
      const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
      outage.decrypt = true;

      const [delivery] = await runtime.emitSync(createEvent());
      const probe = await runtime.probeEndpoint(endpoint.id);

      expect(client.calls).toHaveLength(0);
      expect(delivery?.status).toBe("failed");
      expect(probe.success).toBe(false);
      expect(probe.error).toContain("could not be decrypted");
    } finally {
      await runtime.shutdown();
    }
  });

  test("with the plaintext fallback, signs with a secret stored in plaintext but never with ciphertext", async () => {
    const outage = { encrypt: false, decrypt: false };
    const aes = createAesGcmFieldCryptoProvider({
      keys: { k1: "0123456789abcdef0123456789abcdef" },
      activeKid: "k1",
      keyEncoding: "utf8",
    });
    const { runtime, client } = createSecureRuntime({
      enabled: true,
      failMode: "open",
      openFallback: "plaintext",
      unsafeAllowPlaintextStorage: true,
      fields: { secret: "encrypt" },
      provider: {
        ...aes,
        encrypt: async (input) => {
          if (outage.encrypt) throw new Error("key service unavailable");
          return aes.encrypt(input);
        },
        decrypt: async (input) => {
          if (outage.decrypt) throw new Error("key service unavailable");
          return aes.decrypt(input);
        },
      },
    });

    try {
      const encrypted = await addSignedEndpoint(runtime, "whsec_encrypted");
      outage.encrypt = true;
      const plaintext = await addSignedEndpoint(runtime, "whsec_plaintext");
      outage.encrypt = false;
      outage.decrypt = true;

      expect(await runtime.getEndpoint(encrypted.id)).not.toHaveProperty(
        "secret",
      );
      expect((await runtime.getEndpoint(plaintext.id))?.secret).toBe(
        "whsec_plaintext",
      );
      const deliveries = await runtime.emitSync(createEvent());

      const byEndpoint = new Map(
        deliveries.map((delivery) => [delivery.endpointId, delivery]),
      );
      expect(byEndpoint.get(encrypted.id)?.attempts[0]?.error).toContain(
        "could not be decrypted",
      );
      expect(byEndpoint.get(plaintext.id)?.status).toBe("success");
      expect(client.calls).toHaveLength(1);
      expect(isSignedWith(client.calls[0], "whsec_plaintext")).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  });

  test("an update that does not set a secret keeps the stored one", async () => {
    const { config, outage } = createSwitchableCrypto();
    const { runtime, endpointStore, client } = createSecureRuntime(config);

    try {
      const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
      const stored = endpointStore.rows.get(endpoint.id)?.secret;
      outage.decrypt = true;

      const updated = await runtime.updateEndpoint(endpoint.id, {
        name: "renamed",
      });

      expect(updated.name).toBe("renamed");
      expect(updated).not.toHaveProperty("secret");
      expect(endpointStore.rows.get(endpoint.id)?.secret).toBe(stored);
      outage.decrypt = false;
      expect(await runtime.getEndpoint(endpoint.id)).toMatchObject({
        name: "renamed",
        secret: "whsec_endpoint",
      });
      await runtime.emitSync(createEvent());
      expect(isSignedWith(client.calls[0], "whsec_endpoint")).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  });

  test("an update still encrypts the secret again when it can", async () => {
    let activeKid = "k1";
    const { runtime, endpointStore } = createSecureRuntime({
      enabled: true,
      failMode: "open",
      openFallback: "masked",
      fields: { secret: "encrypt" },
      provider: {
        encrypt: async ({ value }) => ({ ciphertext: `${activeKid}:${value}` }),
        decrypt: async ({ ciphertext }) => ciphertext.replace(/^k\d+:/, ""),
        hash: async ({ value }) => `h:${value}`,
      },
    });

    try {
      const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
      activeKid = "k2";

      await runtime.updateEndpoint(endpoint.id, { name: "renamed" });

      expect(endpointStore.rows.get(endpoint.id)?.secret).toBe(
        "k2:whsec_endpoint",
      );
    } finally {
      await runtime.shutdown();
    }
  });

  test("an update while only encryption fails keeps the stored secret", async () => {
    const { config, outage } = createSwitchableCrypto();
    const { runtime, endpointStore } = createSecureRuntime(config);

    try {
      const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
      const stored = endpointStore.rows.get(endpoint.id)?.secret;
      outage.encrypt = true;

      await runtime.updateEndpoint(endpoint.id, { name: "renamed" });

      expect(endpointStore.rows.get(endpoint.id)?.secret).toBe(stored);
      expect((await runtime.getEndpoint(endpoint.id))?.secret).toBe(
        "whsec_endpoint",
      );
    } finally {
      await runtime.shutdown();
    }
  });

  test("an update that passes back a secret read before the outage keeps the stored one", async () => {
    const { config, outage } = createSwitchableCrypto();
    const { runtime, endpointStore } = createSecureRuntime(config);

    try {
      const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
      const stored = endpointStore.rows.get(endpoint.id)?.secret;
      const read = await runtime.getEndpoint(endpoint.id);
      outage.encrypt = true;
      outage.decrypt = true;

      await runtime.updateEndpoint(endpoint.id, { ...read, name: "renamed" });

      expect(endpointStore.rows.get(endpoint.id)?.secret).toBe(stored);
      outage.encrypt = false;
      outage.decrypt = false;
      expect(await runtime.getEndpoint(endpoint.id)).toMatchObject({
        name: "renamed",
        secret: "whsec_endpoint",
      });
    } finally {
      await runtime.shutdown();
    }
  });

  test("an update can still replace or remove the secret", async () => {
    const { config, outage } = createSwitchableCrypto();
    const { runtime, endpointStore } = createSecureRuntime(config, {
      secretKey: "whsec_shared",
    });

    try {
      const rotated = await addSignedEndpoint(runtime, "whsec_old");
      const removed = await addSignedEndpoint(runtime, "whsec_old");
      const cleared = await addSignedEndpoint(runtime, "whsec_old");
      outage.decrypt = true;
      const read = await runtime.getEndpoint(cleared.id);

      await runtime.updateEndpoint(rotated.id, { secret: "whsec_new" });
      await runtime.updateEndpoint(removed.id, { secret: undefined });
      await runtime.updateEndpoint(cleared.id, { ...read, secret: undefined });

      expect(endpointStore.rows.get(rotated.id)?.secret).toBe("enc:whsec_new");
      expect(endpointStore.rows.get(removed.id)?.secret).toBeUndefined();
      expect(endpointStore.rows.get(cleared.id)?.secret).toBeUndefined();
    } finally {
      await runtime.shutdown();
    }
  });

  test("a copy of an endpoint read during the outage does not claim its secret", async () => {
    const { config, outage } = createSwitchableCrypto();
    const { runtime } = createSecureRuntime(config);

    try {
      const endpoint = await addSignedEndpoint(runtime, "whsec_endpoint");
      outage.decrypt = true;
      const read = await runtime.getEndpoint(endpoint.id);
      if (!read) throw new Error("endpoint missing");

      const { id: _id, createdAt: _c, updatedAt: _u, ...copy } = read;
      await expect(runtime.addEndpoint(copy)).rejects.toThrow("needs a secret");
      await expect(
        runtime.addEndpoints([
          {
            url: "https://example.com/other",
            active: true,
            events: [WebhookEventType.MESSAGE_SENT],
            secret: "whsec_other",
          },
          copy,
        ]),
      ).rejects.toThrow("Webhook endpoint 1 in the batch");
      expect(await runtime.listEndpoints()).toHaveLength(1);
    } finally {
      await runtime.shutdown();
    }
  });
});

describe("WebhookRuntimeService endpoint secrets", () => {
  test("are stored, returned, and signed with exactly as given", async () => {
    const { config } = createSwitchableCrypto({ failMode: "closed" });
    const { runtime, endpointStore, client } = createSecureRuntime(config);

    try {
      const endpoint = await addSignedEndpoint(runtime, " whsec_padded ");

      expect(endpoint.secret).toBe(" whsec_padded ");
      expect(endpointStore.rows.get(endpoint.id)?.secret).toBe(
        "enc: whsec_padded ",
      );
      expect((await runtime.getEndpoint(endpoint.id))?.secret).toBe(
        " whsec_padded ",
      );
      await runtime.emitSync(createEvent());
      expect(isSignedWith(client.calls[0], " whsec_padded ")).toBe(true);
    } finally {
      await runtime.shutdown();
    }
  });
});
