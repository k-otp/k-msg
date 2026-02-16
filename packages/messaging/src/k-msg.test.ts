import { describe, expect, mock, test } from "bun:test";
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Provider,
  type SendInput,
} from "@k-msg/core";
import { KMsg } from "./k-msg";

describe("KMsg", () => {
  test("should send a message and call hooks", async () => {
    const sendMock = mock(async (options: any) => {
      return ok({
        messageId: options.messageId || "test-id",
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      });
    });

    const mockProvider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const beforeSend = mock(() => {});
    const success = mock(() => {});

    const kmsg = new KMsg({
      providers: [mockProvider],
      hooks: {
        onBeforeSend: beforeSend,
        onSuccess: success,
      },
    });

    const options: SendInput = {
      to: "01012345678",
      from: "021234567",
      text: "Hello #{name}!",
      variables: { name: "World" },
    };

    const result = await kmsg.send(options);

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe("SENT");
    }

    expect(beforeSend).toHaveBeenCalled();
    expect(success).toHaveBeenCalled();

    const sentOptions = sendMock.mock.calls[0][0] as unknown as Record<
      string,
      unknown
    >;
    expect(sentOptions.text).toBe("Hello World!");
    expect(sentOptions.messageId).toBeDefined();
  });

  test("should call onError hook on failure", async () => {
    const error = new KMsgError(KMsgErrorCode.MESSAGE_SEND_FAILED, "Failed");
    const failingProvider: Provider = {
      id: "fail",
      name: "Failing Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: mock(async () => fail(error)),
    };

    const onError = mock(() => {});
    const kmsg = new KMsg({
      providers: [failingProvider],
      hooks: { onError },
    });

    const options: SendInput = {
      to: "01012345678",
      from: "021234567",
      text: "Hello",
    };

    const result = await kmsg.send(options);

    expect(result.isFailure).toBe(true);
    expect(onError).toHaveBeenCalled();
  });

  test("ignores legacy defaults.from and requires per-message or provider-level sender", async () => {
    const sendMock = mock(async (options: any) =>
      ok({
        messageId: options.messageId || "test-id",
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      }),
    );

    const mockProvider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const legacyDefaults = {
      // Backward-compat: legacy configs may still include this key.
      from: "029999999",
    };

    const kmsg = new KMsg({
      providers: [mockProvider],
      defaults: legacyDefaults as unknown as {
        sms?: { autoLmsBytes?: number };
      },
    });

    const result = await kmsg.send({
      to: "01012345678",
      text: "Hello",
    });

    expect(result.isSuccess).toBe(true);
    const sentOptions = sendMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sentOptions.from).toBeUndefined();
  });

  test("ALIMTALK fails when plusId policy requires explicit value and inference is unsupported", async () => {
    const sendMock = mock(async (options: any) =>
      ok({
        messageId: options.messageId || "test-id",
        status: "SENT" as const,
        providerId: "solapi",
        type: options.type,
        to: options.to,
      }),
    );
    const provider: Provider = {
      id: "solapi",
      name: "SOLAPI",
      supportedTypes: ["ALIMTALK"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
      getOnboardingSpec: () => ({
        providerId: "solapi",
        channelOnboarding: "none",
        templateLifecycleApi: "unavailable",
        plusIdPolicy: "required_if_no_inference",
        plusIdInference: "unsupported",
        checks: [],
      }),
    };

    const kmsg = new KMsg({
      providers: [provider],
      defaults: {
        kakao: { profileId: "pf-id" },
      },
    });

    const result = await kmsg.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateCode: "TPL_1",
      variables: { code: "1234" },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toContain("plusId is required");
    }
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("ALIMTALK passes when provider plusId policy is optional", async () => {
    const sendMock = mock(async (options: any) =>
      ok({
        messageId: options.messageId || "test-id",
        status: "SENT" as const,
        providerId: "iwinv",
        type: options.type,
        to: options.to,
      }),
    );
    const provider: Provider = {
      id: "iwinv",
      name: "IWINV",
      supportedTypes: ["ALIMTALK"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
      getOnboardingSpec: () => ({
        providerId: "iwinv",
        channelOnboarding: "manual",
        templateLifecycleApi: "available",
        plusIdPolicy: "optional",
        plusIdInference: "unsupported",
        checks: [],
      }),
    };

    const kmsg = new KMsg({
      providers: [provider],
      defaults: {
        kakao: { profileId: "sender-key" },
      },
    });

    const result = await kmsg.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateCode: "TPL_1",
      variables: { code: "1234" },
    });

    expect(result.isSuccess).toBe(true);
    expect(sendMock).toHaveBeenCalled();
  });
});
