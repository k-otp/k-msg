import { describe, expect, test } from "bun:test";
import type { FieldCryptoConfig } from "@k-msg/core";
import { HyperdriveDeliveryTrackingStore } from "../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import { CloudflareObjectDeliveryTrackingStore } from "../adapters/cloudflare/object-delivery-tracking.store";
import {
  applyTrackingCryptoOnWrite,
  normalizeTrackingFilterWithHashes,
} from "./field-crypto";
import type { TrackingRecord } from "./types";

function createConfig(
  patch: Partial<FieldCryptoConfig> = {},
): FieldCryptoConfig {
  return {
    enabled: true,
    fields: {
      to: "encrypt+hash",
      from: "encrypt+hash",
    },
    provider: {
      encrypt: async ({ value }) => ({ ciphertext: value }),
      decrypt: async ({ ciphertext }) => ciphertext,
      hash: async ({ value }) => `h:${value}`,
    },
    ...patch,
  };
}

function createRecord(): TrackingRecord {
  const now = new Date();
  return {
    messageId: "m-1",
    providerId: "p-1",
    providerMessageId: "pm-1",
    type: "SMS",
    to: "01012345678",
    from: "01011112222",
    requestedAt: now,
    status: "SENT",
    statusUpdatedAt: now,
    attemptCount: 0,
    nextCheckAt: now,
  };
}

describe("delivery tracking field crypto policy", () => {
  test("object store fails fast when secure mode is enabled and lookup fields are plain", () => {
    const badConfig = createConfig({
      fields: {
        to: "plain",
        from: "encrypt+hash",
      },
    });

    expect(
      () =>
        new CloudflareObjectDeliveryTrackingStore(
          {} as never,
          {
            secureMode: true,
            compatPlainColumns: false,
            fieldCrypto: {
              config: badConfig,
            },
          },
        ),
    ).toThrow("secure mode requires non-plain policy for `to`");
  });

  test("sql store fails fast when secure schema is enabled without fieldCrypto config", () => {
    expect(
      () =>
        new HyperdriveDeliveryTrackingStore(
          {
            dialect: "sqlite",
            query: async () => ({ rows: [] }),
          } as never,
          {
            tableName: "kmsg_delivery_tracking",
            fieldCryptoSchema: {
              enabled: true,
              mode: "secure",
              compatPlainColumns: false,
            },
          },
        ),
    ).toThrow("fieldCrypto config is required when fieldCryptoSchema is enabled");
  });

  test("fail-open path emits degraded state and metric tags", async () => {
    const events: Array<Record<string, unknown>> = [];
    const record = createRecord();
    const config = createConfig({
      failMode: "open",
      openFallback: "masked",
      provider: {
        encrypt: async () => {
          throw new Error("encrypt failed");
        },
        decrypt: async ({ ciphertext }) => ciphertext,
        hash: async ({ value }) => `h:${value}`,
      },
    });

    const columns = await applyTrackingCryptoOnWrite(
      record,
      {
        config,
        metrics: async (event) => {
          events.push(event as Record<string, unknown>);
        },
      },
      {
        tableName: "kmsg_delivery_tracking",
        store: "memory",
      },
      {
        secureMode: true,
        compatPlainColumns: false,
      },
    );

    expect(columns.cryptoState).toBe("degraded");
    const failEvent = events.find((event) => event.name === "crypto_fail_count");
    expect(failEvent).toBeTruthy();
    expect((failEvent?.tags as Record<string, unknown>).operation).toBe(
      "encrypt",
    );
    expect((failEvent?.tags as Record<string, unknown>).failMode).toBe("open");
    expect((failEvent?.tags as Record<string, unknown>).fallback).toBe(
      "masked",
    );
  });

  test("to/from filters are normalized consistently before hash lookup", async () => {
    const normalizedFilter = await normalizeTrackingFilterWithHashes(
      {
        to: ["010-1234-5678", "010 1234 5678", "01012345678"],
      },
      {
        config: createConfig(),
      },
      {
        secureMode: true,
        compatPlainColumns: false,
      },
    );

    expect(normalizedFilter.toHash).toEqual([
      "h:01012345678",
      "h:01012345678",
      "h:01012345678",
    ]);
    expect(normalizedFilter.to).toBeUndefined();
  });
});
