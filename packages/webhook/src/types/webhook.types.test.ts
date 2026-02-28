import { describe, expect, test } from "bun:test";
import {
  WebhookDeliverySchema,
  WebhookEndpointSchema,
  WebhookEventSchema,
} from "./webhook.types";

describe("webhook.types schema", () => {
  test("coerces timestamp from string/number and rejects invalid timestamp", () => {
    const base = {
      id: "evt-1",
      type: "message.sent",
      data: {},
      metadata: {},
      version: "1",
    };

    const fromString = WebhookEventSchema.safeParse({
      ...base,
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    const fromNumber = WebhookEventSchema.safeParse({
      ...base,
      timestamp: Date.parse("2026-01-01T00:00:00.000Z"),
    });
    const invalid = WebhookEventSchema.safeParse({
      ...base,
      timestamp: "not-a-date",
    });

    expect(fromString.success).toBe(true);
    expect(fromNumber.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  test("enforces retry/url/status boundaries", () => {
    const invalidEndpoint = WebhookEndpointSchema.safeParse({
      id: "ep-1",
      url: "not-url",
      active: true,
      events: ["message.sent"],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      retryConfig: {
        maxRetries: 11,
        retryDelayMs: 1000,
        backoffMultiplier: 1,
      },
    });

    const validDelivery = WebhookDeliverySchema.safeParse({
      id: "d-1",
      endpointId: "ep-1",
      eventId: "ev-1",
      url: "https://example.com",
      httpMethod: "POST",
      headers: {},
      payload: "{}",
      attempts: [],
      status: "pending",
      createdAt: new Date(),
    });

    expect(invalidEndpoint.success).toBe(false);
    expect(validDelivery.success).toBe(true);
  });
});
