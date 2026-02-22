import { describe, expect, test } from "bun:test";
import { KMsgErrorCode } from "@k-msg/core";
import { MockProvider } from "./mock.provider";

describe("MockProvider", () => {
  test("returns warning when ALIMTALK failover is requested", async () => {
    const provider = new MockProvider();

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { code: "1234" },
      failover: { enabled: true, fallbackContent: "fallback" },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.warnings?.[0]?.code).toBe(
        "FAILOVER_UNSUPPORTED_PROVIDER",
      );
    }
  });

  test("applies mock scenario scripts with mixed outcomes", async () => {
    const provider = new MockProvider();
    provider.mockScenario([
      { outcome: "failure", code: KMsgErrorCode.NETWORK_ERROR },
      { outcome: "delay", durationMs: 1 },
      { outcome: "success" },
    ]);

    const firstAttempt = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { code: "1234" },
    });

    const secondAttempt = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { code: "1234" },
    });

    const thirdAttempt = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { code: "1234" },
    });

    expect(firstAttempt.isFailure).toBe(true);
    expect(secondAttempt.isSuccess).toBe(true);
    expect(thirdAttempt.isSuccess).toBe(true);
    expect(provider.calls).toHaveLength(3);
  });

  test("supports timeout outcome with retry hint", async () => {
    const provider = new MockProvider();
    provider.mockScenario([
      { outcome: "timeout", retryAfterMs: 150, durationMs: 1 },
    ]);

    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      text: "code {{code}}",
    });

    expect(result.isFailure).toBe(true);
    expect(result.isFailure ? result.error.code : undefined).toBe(
      KMsgErrorCode.NETWORK_TIMEOUT,
    );
  });
});
