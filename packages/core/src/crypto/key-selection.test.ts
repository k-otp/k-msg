import { describe, expect, test } from "bun:test";
import {
  extractEnvelopeKid,
  normalizeKidList,
  resolveFieldDecryptKids,
  resolveFieldEncryptKid,
} from "./key-selection";
import type { FieldCryptoConfig, KeyResolver } from "./types";

function configWith(keyResolver?: KeyResolver): FieldCryptoConfig {
  return {
    enabled: true,
    fields: { to: "encrypt" },
    provider: {
      encrypt: async ({ value }) => ({ ciphertext: value }),
      decrypt: async ({ ciphertext }) => ciphertext,
      hash: async ({ value }) => value,
    },
    ...(keyResolver ? { keyResolver } : {}),
  };
}

const context = { tableName: "t", fieldPath: "to" };
const envelope = (kid: string) =>
  JSON.stringify({ v: 1, alg: "A256GCM", kid, iv: "i", tag: "t", ct: "c" });

describe("field crypto key selection", () => {
  test("normalizeKidList keeps trimmed non-empty strings", () => {
    expect(normalizeKidList([" a ", "", 1, "b", null])).toEqual(["a", "b"]);
    expect(normalizeKidList(undefined)).toEqual([]);
  });

  test("extractEnvelopeKid reads only v1 envelopes, verbatim", () => {
    expect(extractEnvelopeKid(envelope("k1"))).toBe("k1");
    expect(extractEnvelopeKid(envelope(" k1 "))).toBe(" k1 ");
    expect(extractEnvelopeKid(envelope(""))).toBeUndefined();
    expect(
      extractEnvelopeKid(JSON.stringify({ kid: "meta", payload: "x" })),
    ).toBeUndefined();
    expect(extractEnvelopeKid("plain")).toBeUndefined();
    expect(extractEnvelopeKid("{not json")).toBeUndefined();
    expect(extractEnvelopeKid(undefined)).toBeUndefined();
  });

  test("resolveFieldEncryptKid trims the kid and ignores a blank one", async () => {
    expect(await resolveFieldEncryptKid(configWith(), context)).toBeUndefined();
    const trimmed = configWith({ resolveEncryptKey: () => ({ kid: " k2 " }) });
    expect(await resolveFieldEncryptKid(trimmed, context)).toBe("k2");
    const blank = configWith({ resolveEncryptKey: () => ({ kid: "  " }) });
    expect(await resolveFieldEncryptKid(blank, context)).toBeUndefined();
  });

  test("resolveFieldDecryptKids moves a listed envelope kid first", async () => {
    const resolver: KeyResolver = {
      resolveEncryptKey: () => ({ kid: "new" }),
      resolveDecryptKeys: () => ["new", "old"],
    };
    expect(
      await resolveFieldDecryptKids(configWith(resolver), {
        ...context,
        ciphertext: envelope("old"),
      }),
    ).toEqual(["old", "new"]);
  });

  test("resolveFieldDecryptKids puts the envelope kid first", async () => {
    const resolver: KeyResolver = {
      resolveEncryptKey: () => ({ kid: "new" }),
      resolveDecryptKeys: () => [" new ", ""],
    };
    expect(
      await resolveFieldDecryptKids(configWith(resolver), {
        ...context,
        ciphertext: envelope("old"),
      }),
    ).toEqual(["old", "new"]);
    expect(
      await resolveFieldDecryptKids(configWith(resolver), {
        ...context,
        ciphertext: envelope("new"),
      }),
    ).toEqual(["new"]);
  });

  test("resolveFieldDecryptKids falls back to the envelope or nothing", async () => {
    expect(
      await resolveFieldDecryptKids(configWith(), {
        ...context,
        ciphertext: envelope("k1"),
      }),
    ).toEqual(["k1"]);
    expect(
      await resolveFieldDecryptKids(configWith(), {
        ...context,
        ciphertext: "plain",
      }),
    ).toBeUndefined();
    const empty = configWith({
      resolveEncryptKey: () => ({ kid: "k" }),
      resolveDecryptKeys: () => [],
    });
    expect(
      await resolveFieldDecryptKids(empty, { ...context, ciphertext: "plain" }),
    ).toBeUndefined();
  });
});
