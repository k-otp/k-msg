import { describe, expect, test } from "bun:test";
import {
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

  test("requires a key for the active kid", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
        KMSG_ACTIVE_KID: "k2",
      }),
    ).rejects.toThrow('no key for the active kid "k2"');
  });

  test("rejects unknown field modes", async () => {
    await expect(
      resolveMigrationFieldCrypto({
        [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
        KMSG_ACTIVE_KID: "k1",
        [FIELD_CRYPTO_FIELDS_ENV]: JSON.stringify({ to: "encrypted" }),
      }),
    ).rejects.toThrow(`${FIELD_CRYPTO_FIELDS_ENV}.to`);
  });

  test("builds AES-GCM options from the environment", async () => {
    const options = await resolveMigrationFieldCrypto({
      [FIELD_CRYPTO_KEYS_ENV]: JSON.stringify({ k1: KEY }),
      [FIELD_CRYPTO_HASH_KEYS_ENV]: JSON.stringify({ k1: HASH_KEY }),
      [FIELD_CRYPTO_TENANT_ENV]: " tenant-a ",
      KMSG_ACTIVE_KID: "k1",
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
