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
    expect(
      result.isFailure ? result.error.details?.providerId : undefined,
    ).toBe("mock");
  });

  test("preserves request-aborted scenario classification", async () => {
    const provider = new MockProvider();
    provider.mockScenario([
      { outcome: "failure", code: KMsgErrorCode.REQUEST_ABORTED },
    ]);

    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      text: "code {{code}}",
    });

    expect(result.isFailure ? result.error.code : undefined).toBe(
      KMsgErrorCode.REQUEST_ABORTED,
    );
  });

  test("uses the id it is given, so two mocks can back different routes", async () => {
    const kakao = new MockProvider({ id: "mock-kakao" });
    const sms = new MockProvider({ id: "mock-sms" });

    expect(kakao.id).toBe("mock-kakao");
    expect(sms.id).toBe("mock-sms");
    expect(new MockProvider().id).toBe("mock");

    const sent = await sms.send({ type: "SMS", to: "01012345678", text: "hi" });
    expect(sent.isSuccess ? sent.value.providerId : undefined).toBe("mock-sms");

    sms.mockFailure(1);
    const failed = await sms.send({
      type: "SMS",
      to: "01012345678",
      text: "hi",
    });
    expect(
      failed.isFailure ? failed.error.details?.providerId : undefined,
    ).toBe("mock-sms");

    // The onboarding spec describes the mock itself, whatever its id.
    expect(kakao.getOnboardingSpec()).toEqual(
      new MockProvider().getOnboardingSpec(),
    );

    expect(() => new MockProvider({ id: " " })).toThrow(
      "MockProvider id must be a non-empty string",
    );
  });

  test("reports sent messages as delivered until told otherwise", async () => {
    const provider = new MockProvider();
    const sent = await provider.send({
      type: "SMS",
      to: "01012345678",
      text: "hello",
    });
    if (sent.isFailure) throw sent.error;
    const providerMessageId = sent.value.providerMessageId ?? "";
    const query = {
      providerMessageId,
      type: "SMS" as const,
      to: "01012345678",
      requestedAt: new Date(),
    };

    const delivered = await provider.getDeliveryStatus(query);
    expect(delivered.isSuccess && delivered.value?.status).toBe("DELIVERED");

    provider.setDeliveryStatus(providerMessageId, "FAILED", {
      statusCode: "E101",
      statusMessage: "handset unreachable",
    });
    const failed = await provider.getDeliveryStatus(query);
    expect(failed.isSuccess && failed.value).toMatchObject({
      status: "FAILED",
      statusCode: "E101",
      statusMessage: "handset unreachable",
    });

    const unknown = await provider.getDeliveryStatus({
      ...query,
      providerMessageId: "mock-unknown",
    });
    expect(unknown.isSuccess && unknown.value).toBeNull();
  });
});
