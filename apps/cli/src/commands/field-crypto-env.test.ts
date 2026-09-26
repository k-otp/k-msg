import { describe, expect, test } from "bun:test";
import {
  ACTIVE_KID_ENV,
  FIELD_CRYPTO_FIELDS_ENV,
  FIELD_CRYPTO_HASH_KEYS_ENV,
  FIELD_CRYPTO_KEYS_ENV,
  FIELD_CRYPTO_TENANT_ENV,
  resolveMigrationFieldCrypto,
} from "./field-crypto-env";

const KEY = Buffer.alloc(32, 1).toString("base64url");
const HASH_KEY = Buffer.alloc(32, 2).toString("base64url");

describe("resolveMigrationFieldCrypto", () => {
  test("requires the key map", async () => {
    await expect(resolveMigrationFieldCrypto({})).rejects.toThrow(
      FIELD_CRYPTO_KEYS_ENV,
    );
  });

  test.each([
    ["not json", "must be a JSON object"],
    ['["k1"]', "must be a JSON object"],
    ["{}", "must map each key id"],
    ['{"k1":1}', "must map each key id"],
  ])("rejects a malformed key map %p", async (raw, message) => {
    await expect(
      resolveMigrationFieldCrypto({ [FIELD_CRYPTO_KEYS_ENV]: raw }),
    ).rejects.toThrow(message);
  });

  test("requires an explicit active kid", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ default: KEY }),
      }),
    ).rejects.toThrow("Set KMSG_ACTIVE_KID");
  });

  test.each([
    ["not base64url!", "must be a base64 or base64url key of 32 bytes"],
    [Buffer.alloc(16, 1).toString("base64url"), "of 32 bytes"],
  ])("rejects malformed key material %p", async (key, message) => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: key }),
        [ACTIVE_KID_ENV]: "k1",
      }),
    ).rejects.toThrow(message);
  });

  test("accepts padded standard base64 keys, as the provider does", async () => {
    const standardKey = Buffer.alloc(32, 0xfb).toString("base64");
    expect(standardKey).toMatch(/[+/].*=$/);

    const options = await resolveMigrationFieldCrypto({
      [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: standardKey }),
      [ACTIVE_KID_ENV]: "k1",
    });
    const encrypted = await options.config.provider.encrypt({
      value: "01012345678",
      aad: { messageId: "m1", fieldPath: "to" },
      path: "to",
    });
    expect(encrypted.kid).toBe("k1");
  });

  test("does not treat inherited properties as keys", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
        [ACTIVE_KID_ENV]: "constructor",
      }),
    ).rejects.toThrow('no key for the active kid "constructor"');
  });

  test("rejects an empty field map", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
        [ACTIVE_KID_ENV]: "k1",
        [FIELD_CRYPTO_FIELDS_ENV]: "{}",
      }),
    ).rejects.toThrow("at least one field path");
  });

  test("requires a key for the active kid", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
        [ACTIVE_KID_ENV]: "k2",
      }),
    ).rejects.toThrow('no key for the active kid "k2"');
  });

  test("rejects unknown field modes", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
        [ACTIVE_KID_ENV]: "k1",
        [FIELD_CRYPTO_FIELDS_ENV]: JSON.stringify({ to: "encrypted" }),
      }),
    ).rejects.toThrow(`${FIELD_CRYPTO_FIELDS_ENV}.to`);
  });

  test("builds AES-GCM options from the environment", async () => {
    const options = await resolveMigrationFieldCrypto({
      [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
      [FIELD_CRYPTO_HASH_KEYS_ENV]: JSON.stringify({ k1: HASH_KEY }),
      [FIELD_CRYPTO_TENANT_ENV]: " tenant-a ",
      [ACTIVE_KID_ENV]: "k1",
    });

    expect(options.tenantId).toBe("tenant-a");
    expect(options.config.fields).toEqual({
      to: "encrypt+hash",
      from: "encrypt+hash",
    });

    const aad = { messageId: "m1", fieldPath: "to" };
    const encrypted = await options.config.provider.encrypt({
      value: "01012345678",
      aad,
      path: "to",
    });
    expect(encrypted.kid).toBe("k1");
    expect(
      await options.config.provider.decrypt({
        ciphertext:
          typeof encrypted.ciphertext === "string"
            ? encrypted.ciphertext
            : JSON.stringify(encrypted.ciphertext),
        aad,
        path: "to",
      }),
    ).toBe("01012345678");
  });
});
