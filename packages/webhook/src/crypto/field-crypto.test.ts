import { describe, expect, test } from "bun:test";
import type { FieldCryptoConfig } from "@k-msg/core";
import { protectFieldValue, revealFieldValue } from "./field-crypto";

// Decrypts only with the exact AAD it encrypted with, as AES-GCM would.
function createAadBoundConfig(): FieldCryptoConfig {
  return {
    enabled: true,
    fields: { secret: "encrypt" },
    provider: {
      encrypt: async ({ value, aad }) => ({
        ciphertext: `enc:${JSON.stringify(aad)}:${value}`,
      }),
      decrypt: async ({ ciphertext, aad }) => {
        const prefix = `enc:${JSON.stringify(aad)}:`;
        if (!ciphertext.startsWith(prefix)) throw new Error("AAD mismatch");
        return ciphertext.slice(prefix.length);
      },
      hash: async ({ value }) => `h:${value}`,
    },
  };
}

const aad = { tableName: "webhook_endpoint", messageId: "ep-1" };

describe("webhook field crypto AAD", () => {
  test("binds ciphertext to the tenant when one is set", async () => {
    const config = createAadBoundConfig();
    const stored = await protectFieldValue(config, {
      value: "my-secret",
      path: "secret",
      aad,
      tenantId: "tenant-a",
    });

    expect(stored).toContain('"tenantId":"tenant-a"');
    expect(
      await revealFieldValue(config, {
        value: stored,
        path: "secret",
        aad,
        tenantId: "tenant-a",
      }),
    ).toBe("my-secret");
    await expect(
      revealFieldValue(config, {
        value: stored,
        path: "secret",
        aad,
        tenantId: "tenant-b",
      }),
    ).rejects.toMatchObject({ kind: "decrypt", fieldPath: "secret" });
  });

  test("still reads values written before tenant binding", async () => {
    const config = createAadBoundConfig();
    const legacy = await protectFieldValue(config, {
      value: "my-secret",
      path: "secret",
      aad,
    });

    expect(
      await revealFieldValue(config, {
        value: legacy,
        path: "secret",
        aad,
        tenantId: "tenant-a",
      }),
    ).toBe("my-secret");
  });
});
