import { describe, expect, test } from "bun:test";
import {
  assertFieldCryptoConfig,
  resolveFieldMode,
  validateFieldCryptoConfig,
} from "./policy";
import type { FieldCryptoConfig } from "./types";
import { normalizePhoneForHash } from "./types";

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
      encrypt: async ({ value }) => ({
        ciphertext: value,
      }),
      decrypt: async ({ ciphertext }) => ciphertext,
      hash: async ({ value }) => `hash:${value}`,
    },
    ...patch,
  };
}

describe("field crypto policy", () => {
  test("validateFieldCryptoConfig returns valid for basic secure config", () => {
    const result = validateFieldCryptoConfig(createConfig());
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  test("validateFieldCryptoConfig fails for empty fields", () => {
    const result = validateFieldCryptoConfig(
      createConfig({
        fields: {},
      }),
    );

    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (issue) => issue.rule === "fieldCrypto.fields.non_empty",
      ),
    ).toBe(true);
  });

  test("assertFieldCryptoConfig fails for fail-open plaintext without unsafe flag", () => {
    const config = createConfig({
      failMode: "open",
      openFallback: "plaintext",
      unsafeAllowPlaintextStorage: false,
    });

    expect(() => assertFieldCryptoConfig(config)).toThrow(
      "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
    );
  });

  test("assertFieldCryptoConfig rejects plain lookup fields in secure mode", () => {
    const config = createConfig({
      fields: {
        to: "plain",
        from: "encrypt+hash",
      },
    });

    expect(() =>
      assertFieldCryptoConfig(config, {
        secureMode: true,
        compatPlainColumns: false,
      }),
    ).toThrow("secure mode requires non-plain policy for `to`");
  });

  test("resolveFieldMode resolves metadata wildcard", () => {
    const config = createConfig({
      fields: {
        to: "encrypt+hash",
        from: "encrypt+hash",
        "metadata.*": "mask",
      },
    });

    expect(resolveFieldMode(config, "metadata.phoneNumber", "plain")).toBe(
      "mask",
    );
  });

  test("normalizePhoneForHash keeps leading plus and strips format chars", () => {
    expect(normalizePhoneForHash("010-1234-5678")).toBe("01012345678");
    expect(normalizePhoneForHash("010 1234 5678")).toBe("01012345678");
    expect(normalizePhoneForHash("  +82 10-1234-5678 ")).toBe("+821012345678");
  });
});
