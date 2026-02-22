import { describe, expect, test } from "bun:test";
import {
  createRollingKeyResolver,
  createStaticKeyResolver,
} from "./key-resolver";

describe("key resolver adapters", () => {
  test("createStaticKeyResolver returns configured encrypt/decrypt kids", async () => {
    const resolver = createStaticKeyResolver({
      activeKid: "k-2026-01",
      decryptKids: ["k-2025-12", "k-2026-01"],
    });

    const encrypt = await resolver.resolveEncryptKey({
      tenantId: "tenant-a",
    });
    const decrypt = await resolver.resolveDecryptKeys?.({
      tenantId: "tenant-a",
    });

    expect(encrypt.kid).toBe("k-2026-01");
    expect(decrypt).toEqual(["k-2026-01", "k-2025-12"]);
  });

  test("createRollingKeyResolver keeps old/new/new2 in decrypt candidates", async () => {
    const baseResolver = createStaticKeyResolver({
      activeKid: "k-2026-01",
      decryptKids: ["k-2025-12", "k-2026-01"],
    });
    const rollingResolver = createRollingKeyResolver(baseResolver, {
      seed: "rollout-seed",
      buckets: [
        { kid: "k-2026-02", percentage: 50 },
        { kid: "k-2026-03", percentage: 25 },
      ],
      defaultKid: "k-2026-01",
    });

    const context = {
      tenantId: "tenant-a",
      providerId: "provider-1",
      messageId: "msg-rotation",
    };

    const encrypt = await rollingResolver.resolveEncryptKey(context);
    const decrypt = await rollingResolver.resolveDecryptKeys?.({
      ...context,
      ciphertext:
        '{"v":1,"alg":"A256GCM","kid":"k-2025-12","iv":"a","tag":"b","ct":"c"}',
    });

    expect(["k-2026-01", "k-2026-02", "k-2026-03"]).toContain(encrypt.kid);
    expect(decrypt).toEqual(
      expect.arrayContaining(["k-2025-12", "k-2026-01", "k-2026-02", "k-2026-03"]),
    );
  });
});

