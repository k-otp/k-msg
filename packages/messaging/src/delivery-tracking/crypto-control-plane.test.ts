import { describe, expect, test } from "bun:test";
import { CryptoCircuitController } from "./crypto-control-plane";

describe("CryptoCircuitController", () => {
  test("opens only for key-related failures", async () => {
    const controller = new CryptoCircuitController({
      failureThreshold: 2,
      windowMs: 60_000,
      cooldownMs: 60_000,
    });

    const context = {
      operation: "decrypt" as const,
      store: "sql" as const,
      tenantId: "tenant-a",
      providerId: "provider-a",
      kid: "k-1",
    };

    await controller.onFailure({
      ...context,
      error: new Error("generic crypto error"),
      errorClass: "crypto_error",
    });
    let gate = await controller.beforeOperation(context);
    expect(gate.state).toBe("closed");
    expect(gate.allowed).toBe(true);

    await controller.onFailure({
      ...context,
      error: new Error("kid mismatch"),
      errorClass: "kid_mismatch",
    });
    await controller.onFailure({
      ...context,
      error: new Error("kid mismatch"),
      errorClass: "kid_mismatch",
    });
    gate = await controller.beforeOperation(context);
    expect(gate.state).toBe("open");
    expect(gate.allowed).toBe(false);
  });

  test("recovers to closed on half-open success", async () => {
    const controller = new CryptoCircuitController({
      failureThreshold: 1,
      windowMs: 60_000,
      cooldownMs: 1,
    });

    const context = {
      operation: "decrypt" as const,
      store: "sql" as const,
      tenantId: "tenant-a",
      providerId: "provider-a",
      kid: "k-1",
    };

    await controller.onFailure({
      ...context,
      error: new Error("aad mismatch"),
      errorClass: "aad_mismatch",
    });
    await Bun.sleep(5);

    const halfOpen = await controller.beforeOperation(context);
    expect(halfOpen.state).toBe("half-open");
    expect(halfOpen.allowed).toBe(true);

    await controller.onSuccess(context);
    const closed = await controller.beforeOperation(context);
    expect(closed.state).toBe("closed");
    expect(closed.allowed).toBe(true);
  });
});
