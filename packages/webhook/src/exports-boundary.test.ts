import { describe, expect, test } from "bun:test";

describe("webhook export boundaries", () => {
  test("root exports runtime symbols only", async () => {
    const root = await import("./index");

    expect(typeof root.WebhookRuntimeService).toBe("function");
    expect(typeof root.createInMemoryWebhookPersistence).toBe("function");

    expect("BatchDispatcher" in root).toBe(false);
    expect("LoadBalancer" in root).toBe(false);
    expect("QueueManager" in root).toBe(false);
    expect("EndpointManager" in root).toBe(false);
    expect("DeliveryStore" in root).toBe(false);
    expect("EventStore" in root).toBe(false);
    expect("MockHttpClient" in root).toBe(false);
  });

  test("toolkit subpath exports advanced symbols", async () => {
    const toolkit = await import("./toolkit/index");

    expect(typeof toolkit.BatchDispatcher).toBe("function");
    expect(typeof toolkit.LoadBalancer).toBe("function");
    expect(typeof toolkit.QueueManager).toBe("function");
    expect(typeof toolkit.EndpointManager).toBe("function");
    expect(typeof toolkit.DeliveryStore).toBe("function");
    expect(typeof toolkit.EventStore).toBe("function");
    expect(typeof toolkit.MockHttpClient).toBe("function");
  });

  test("cloudflare adapter subpath exports persistence factory", async () => {
    const cloudflare = await import("./adapters/cloudflare/index");

    expect(typeof cloudflare.createD1WebhookPersistence).toBe("function");
    expect(typeof cloudflare.buildWebhookSchemaSql).toBe("function");
    expect(typeof cloudflare.initializeWebhookSchema).toBe("function");
  });
});
