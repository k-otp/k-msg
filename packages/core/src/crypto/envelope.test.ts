import { describe, expect, test } from "bun:test";
import {
  assertCryptoEnvelopeV1,
  createAesGcmFieldCryptoProvider,
  toCiphertextEnvelopeString,
} from "./types";

const KEY = Buffer.alloc(32, 3).toString("base64url");

describe("v1 ciphertext envelopes", () => {
  test("the AES-GCM provider emits a v1 envelope", async () => {
    const provider = createAesGcmFieldCryptoProvider({
      keys: { k1: KEY },
      activeKid: "k1",
    });
    const { ciphertext } = await provider.encrypt({
      value: "01012345678",
      aad: { messageId: "m1" },
      path: "to",
    });

    expect(() => assertCryptoEnvelopeV1(ciphertext)).not.toThrow();
    expect(JSON.parse(toCiphertextEnvelopeString(ciphertext))).toMatchObject({
      v: 1,
      alg: "A256GCM",
      kid: "k1",
    });
  });

  test.each([
    [{ v: 2, alg: "A256GCM", kid: "k", iv: "i", tag: "t", ct: "c" }],
    [{ v: 1, alg: "A128GCM", kid: "k", iv: "i", tag: "t", ct: "c" }],
    [{ v: 1, alg: "A256GCM", kid: "k", iv: "i", tag: "t" }],
  ])("rejects %o before it is persisted", (envelope) => {
    expect(() => toCiphertextEnvelopeString(envelope as never)).toThrow(
      "ciphertext envelope must be v1 A256GCM",
    );
  });

  test("keeps a provider's own string form", () => {
    expect(toCiphertextEnvelopeString("opaque-token")).toBe("opaque-token");
  });

  test("stores only the envelope's own fields", () => {
    const envelope = {
      v: 1,
      alg: "A256GCM",
      kid: "k1",
      iv: "iv",
      tag: "tag",
      ct: "ct",
      plaintext: "01012345678",
    };

    expect(JSON.parse(toCiphertextEnvelopeString(envelope))).toEqual({
      v: 1,
      alg: "A256GCM",
      kid: "k1",
      iv: "iv",
      tag: "tag",
      ct: "ct",
    });
  });
});
