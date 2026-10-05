import { describe, expect, mock, spyOn, test } from "bun:test";
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageRepository,
  ok,
  type Provider,
  type ProviderRequestContext,
  type SendInput,
  type SendOptions,
} from "@k-msg/core";
import { estimateSmsBytes } from "./index";
import { KMsg } from "./k-msg";
import { InMemoryMessageRepository } from "./test-utils/in-memory-message-repository";

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
        providerId: "strict-kakao",
        type: options.type,
        to: options.to,
      }),
    );
    const provider: Provider = {
      id: "strict-kakao",
      name: "Strict Kakao",
      supportedTypes: ["ALIMTALK"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
      getOnboardingSpec: () => ({
        providerId: "strict-kakao",
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
      templateId: "TPL_1",
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
      templateId: "TPL_1",
      variables: { code: "1234" },
    });

    expect(result.isSuccess).toBe(true);
    expect(sendMock).toHaveBeenCalled();
  });

  test("builder reuse does not mutate already-built KMsg instances", async () => {
    const smsProvider: Provider = {
      id: "sms-only",
      name: "SMS Only",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: mock(async (options: any) =>
        ok({
          messageId: options.messageId || "sms-id",
          status: "SENT" as const,
          providerId: "sms-only",
          type: options.type,
          to: options.to,
        }),
      ),
    };

    const alimSend = mock(async (options: any) =>
      ok({
        messageId: options.messageId || "alim-id",
        status: "SENT" as const,
        providerId: "alim-only",
        type: options.type,
        to: options.to,
      }),
    );

    const alimProvider: Provider = {
      id: "alim-only",
      name: "ALIMTALK Only",
      supportedTypes: ["ALIMTALK"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: alimSend,
    };

    const builder = KMsg.builder().addProvider(smsProvider);
    const firstKMsg = builder.build();

    // Reuse builder after first build; previously built instance must stay immutable.
    builder.addProvider(alimProvider);

    const result = await firstKMsg.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { code: "1234" },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toContain(
        "No provider available for type ALIMTALK",
      );
    }
    expect(alimSend).not.toHaveBeenCalled();
  });

  test("send accepts array input and returns ordered batch results", async () => {
    const sendMock = mock(async (options: any) => {
      const delayMs =
        options.messageId === "m-1" ? 20 : options.messageId === "m-2" ? 5 : 10;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return ok({
        messageId: options.messageId,
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      });
    });

    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const kmsg = new KMsg({ providers: [provider] });

    const result = await kmsg.send([
      {
        type: "SMS",
        to: "01011110001",
        text: "First",
        messageId: "m-1",
      },
      {
        type: "SMS",
        to: "01011110002",
        text: "Second",
        messageId: "m-2",
      },
      {
        type: "SMS",
        to: "01011110003",
        text: "Third",
        messageId: "m-3",
      },
    ]);

    expect(result.total).toBe(3);
    expect(result.results).toHaveLength(3);

    const messageIds = result.results.map((entry) =>
      entry.isSuccess ? entry.value.messageId : "",
    );
    expect(messageIds).toEqual(["m-1", "m-2", "m-3"]);
  });

  test("send uses detectable provider batch limit for chunking", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const provider: Provider & { maxBatchSize: number } = {
      id: "limited",
      name: "Limited Provider",
      maxBatchSize: 2,
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: mock(async (options: any) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;

        return ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "limited",
          type: options.type,
          to: options.to,
        });
      }),
    };

    const kmsg = new KMsg({ providers: [provider] });

    const batchInput: SendInput[] = Array.from({ length: 5 }, (_, index) => ({
      type: "SMS",
      to: `0102222000${index}`,
      text: `Message ${index}`,
      messageId: `limit-${index}`,
    }));

    const result = await kmsg.send(batchInput);

    expect(result.total).toBe(5);
    expect(result.results).toHaveLength(5);
    expect(maxInFlight).toBe(2);
  });

  test("send uses default chunk size when provider limit is not detectable", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const provider: Provider = {
      id: "default-limit",
      name: "Default Limit Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: mock(async (options: any) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;

        return ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "default-limit",
          type: options.type,
          to: options.to,
        });
      }),
    };

    const kmsg = new KMsg({ providers: [provider] });

    const batchInput: SendInput[] = Array.from({ length: 51 }, (_, index) => ({
      type: "SMS",
      to: `0103333000${index}`,
      text: `Message ${index}`,
      messageId: `default-${index}`,
    }));

    const result = await kmsg.send(batchInput);

    expect(result.total).toBe(51);
    expect(result.results).toHaveLength(51);
    expect(maxInFlight).toBe(50);
  });

  test("none persistence strategy keeps current behavior", async () => {
    const sendMock = mock(async (options: any) =>
      ok({
        messageId: options.messageId,
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      }),
    );

    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const repo = new InMemoryMessageRepository();
    const saveSpy = mock(repo.save.bind(repo));
    repo.save = saveSpy;

    const kmsg = new KMsg({
      providers: [provider],
      persistence: {
        strategy: "none",
        repo,
      },
    });

    const result = await kmsg.send({
      type: "SMS",
      to: "01050000000",
      text: "No persistence",
      messageId: "none-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(sendMock.mock.calls).toHaveLength(1);
    expect(saveSpy).toHaveBeenCalledTimes(0);
  });

  test("log persistence strategy is best-effort and non-blocking", async () => {
    const sendMock = mock(async (options: any) =>
      ok({
        messageId: options.messageId,
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      }),
    );

    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const repo = new InMemoryMessageRepository();
    const saveSpy = mock(
      async (_input: SendInput, _options?: { strategy?: string }) => {
        throw new Error("repo write failed");
      },
    );
    repo.save = saveSpy;

    const kmsg = new KMsg({
      providers: [provider],
      persistence: {
        strategy: "log",
        repo,
      },
    });

    const result = await kmsg.send({
      type: "SMS",
      to: "01050000001",
      text: "Log strategy",
      messageId: "log-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(sendMock.mock.calls).toHaveLength(1);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    const firstSaveCall = saveSpy.mock.calls[0]!;
    const saveOptions = firstSaveCall[1] as { strategy?: string };
    expect(saveOptions?.strategy).toBe("log");
  });

  test("full persistence strategy saves before send and updates after success", async () => {
    const callOrder: string[] = [];

    const saveSpy = mock(
      async (_input: SendInput, _options?: { strategy?: string }) => {
        callOrder.push("save");
        return ok("persist-full-success");
      },
    );
    const updateSpy = mock(
      async (_messageId: string, _result: Record<string, unknown>) => {
        callOrder.push("update");
        return ok(undefined);
      },
    );

    const sendMock = mock(async (options: any) => {
      callOrder.push("send");
      return ok({
        messageId: options.messageId,
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      });
    });

    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const repo: MessageRepository = {
      save: saveSpy,
      update: updateSpy,
      find: mock(async () => ok(null)),
    };

    const kmsg = new KMsg({
      providers: [provider],
      persistence: {
        strategy: "full",
        repo,
      },
    });

    const result = await kmsg.send({
      type: "SMS",
      to: "01050000002",
      text: "Full strategy success",
      messageId: "full-success-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(callOrder).toEqual(["save", "send", "update"]);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const firstSaveCall = saveSpy.mock.calls[0]!;
    const saveOptions = firstSaveCall[1] as { strategy?: string };
    expect(saveOptions?.strategy).toBe("full");

    const firstUpdateCall = updateSpy.mock.calls[0]!;
    const updateRecordId = firstUpdateCall[0];
    expect(updateRecordId).toBe("persist-full-success");

    const updatedPayload = firstUpdateCall[1] as any;
    expect(updatedPayload.status).toBe("SENT");
    expect(updatedPayload.messageId).toBe("full-success-1");
  });

  test("full persistence strategy updates persisted record on send failure", async () => {
    const repo = new InMemoryMessageRepository();
    const saveSpy = mock(repo.save.bind(repo));
    const updateSpy = mock(repo.update.bind(repo));
    repo.save = saveSpy;
    repo.update = updateSpy;

    const sendMock = mock(async () =>
      fail(new KMsgError(KMsgErrorCode.MESSAGE_SEND_FAILED, "provider failed")),
    );

    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const kmsg = new KMsg({
      providers: [provider],
      persistence: {
        strategy: "full",
        repo,
      },
    });

    const result = await kmsg.send({
      type: "SMS",
      to: "01050000003",
      text: "Full strategy failure",
      messageId: "full-fail-1",
    });

    expect(result.isFailure).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    const firstUpdateCall = updateSpy.mock.calls[0]!;
    const updateRecordId = firstUpdateCall[0];
    expect(updateRecordId).toBe("persist-1");

    const updatedPayload = firstUpdateCall[1] as any;
    expect(updatedPayload.status).toBe("FAILED");
    expect(updatedPayload.messageId).toBe("full-fail-1");
  });

  test("queue persistence strategy persists and returns pending result", async () => {
    const sendMock = mock(async (options: any) =>
      ok({
        messageId: options.messageId,
        status: "SENT" as const,
        providerId: "mock",
        type: options.type,
        to: options.to,
      }),
    );

    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: sendMock,
    };

    const repo = new InMemoryMessageRepository();
    const saveSpy = mock(repo.save.bind(repo));
    repo.save = saveSpy;

    const kmsg = new KMsg({
      providers: [provider],
      persistence: {
        strategy: "queue",
        repo,
      },
    });

    const result = await kmsg.send({
      type: "SMS",
      to: "01050000004",
      text: "Queue strategy",
      messageId: "queue-1",
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe("PENDING");
      expect(result.value.messageId).toBe("queue-1");
      expect(result.value.providerId).toBe("mock");
    }

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(0);

    const firstSaveCall = saveSpy.mock.calls[0]!;
    const saveOptions = firstSaveCall[1] as { strategy?: string };
    expect(saveOptions?.strategy).toBe("queue");
  });

  test("Smart Batching: respects individual provider limits in mixed batch", async () => {
    let inFlightA = 0;
    let maxInFlightA = 0;
    let inFlightB = 0;
    let maxInFlightB = 0;

    const providerA: Provider & { batchLimit: number } = {
      id: "mock-provider-a",
      name: "Mock Provider A",
      batchLimit: 2,
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: async (options: any) => {
        inFlightA += 1;
        maxInFlightA = Math.max(maxInFlightA, inFlightA);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlightA -= 1;

        return ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "mock-provider-a",
          type: options.type,
          to: options.to,
        });
      },
    };

    const providerB: Provider & { batchLimit: number } = {
      id: "mock-provider-b",
      name: "Mock Provider B",
      batchLimit: 10,
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send: async (options: any) => {
        inFlightB += 1;
        maxInFlightB = Math.max(maxInFlightB, inFlightB);
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlightB -= 1;

        return ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "mock-provider-b",
          type: options.type,
          to: options.to,
        });
      },
    };

    const providerASendSpy = spyOn(providerA, "send");
    const providerBSendSpy = spyOn(providerB, "send");

    const kmsg = new KMsg({ providers: [providerA, providerB] });

    const providerAInputs: SendInput[] = Array.from(
      { length: 5 },
      (_, index) => ({
        type: "SMS",
        providerId: "mock-provider-a",
        to: `0104444000${index}`,
        text: `A-${index}`,
        messageId: `a-${index}`,
      }),
    );

    const providerBInputs: SendInput[] = Array.from(
      { length: 8 },
      (_, index) => ({
        type: "SMS",
        providerId: "mock-provider-b",
        to: `0105555000${index}`,
        text: `B-${index}`,
        messageId: `b-${index}`,
      }),
    );

    const mixedBatchInput: SendInput[] = [];
    for (
      let index = 0;
      index < Math.max(providerAInputs.length, providerBInputs.length);
      index += 1
    ) {
      const currentA = providerAInputs[index];
      const currentB = providerBInputs[index];
      if (currentA) {
        mixedBatchInput.push(currentA);
      }
      if (currentB) {
        mixedBatchInput.push(currentB);
      }
    }

    const result = await kmsg.send(mixedBatchInput);

    expect(providerASendSpy).toHaveBeenCalledTimes(providerAInputs.length);
    expect(providerBSendSpy).toHaveBeenCalledTimes(providerBInputs.length);

    expect(maxInFlightA).toBe(2);
    expect(maxInFlightB).toBe(8);

    expect(result.total).toBe(mixedBatchInput.length);
    expect(result.results).toHaveLength(mixedBatchInput.length);
  });
  describe("observer hook errors", () => {
    const sentProvider = (
      send: Provider["send"] = mock(async (options: any) =>
        ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "mock",
          type: options.type,
          to: options.to,
        }),
      ),
    ): Provider => ({
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: mock(async () => ({ healthy: true, issues: [] })),
      send,
    });
    const input: SendInput = { to: "01012345678", text: "hello" };

    test("do not turn a message the provider accepted into a failure", async () => {
      const repo = new InMemoryMessageRepository();
      const updateSpy = mock(repo.update.bind(repo));
      repo.update = updateSpy;
      const send = mock(async (options: any) =>
        ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "mock",
          type: options.type,
          to: options.to,
        }),
      );
      const onError = mock(() => {});
      const onHookError = mock(() => {});
      const kmsg = new KMsg({
        providers: [sentProvider(send)],
        persistence: { strategy: "full", repo },
        hooks: {
          onSuccess: () => {
            throw new Error("tracking store unavailable");
          },
          onFinal: async () => {
            throw new Error("metrics down");
          },
          onError,
          onHookError,
        },
      });

      const result = await kmsg.send(input);

      expect(result.isSuccess).toBe(true);
      expect(send).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect((updateSpy.mock.calls[0] as unknown[])[1]).toMatchObject({
        status: "SENT",
      });
      expect(
        onHookError.mock.calls.map((call) => {
          const [error, info] = call as unknown as [
            Error,
            { hook: string; context: { messageId: string } },
          ];
          return [info.hook, error.message, typeof info.context.messageId];
        }),
      ).toEqual([
        ["onSuccess", "tracking store unavailable", "string"],
        ["onFinal", "metrics down", "string"],
      ]);
    });

    test("keep the provider error when a failure hook throws", async () => {
      const providerError = new KMsgError(
        KMsgErrorCode.MESSAGE_SEND_FAILED,
        "provider failed",
      );
      const kmsg = new KMsg({
        providers: [sentProvider(mock(async () => fail(providerError)))],
        hooks: {
          onError: () => {
            throw new Error("logger down");
          },
          onHookError: () => {
            throw new Error("reporter down too");
          },
        },
      });

      const consoleError = spyOn(console, "error").mockImplementation(() => {});
      try {
        const result = await kmsg.send(input);

        expect(result.isFailure).toBe(true);
        if (result.isFailure) {
          expect(result.error).toMatchObject({
            code: KMsgErrorCode.MESSAGE_SEND_FAILED,
            message: "provider failed",
          });
        }
        // Both the reporter's failure and the original hook error are logged.
        expect(consoleError).toHaveBeenCalledTimes(2);
      } finally {
        consoleError.mockRestore();
      }
    });

    test("fall back to console.error without onHookError", async () => {
      const kmsg = new KMsg({
        providers: [sentProvider()],
        hooks: {
          onSuccess: () => {
            throw new Error("logger down");
          },
        },
      });

      const consoleError = spyOn(console, "error").mockImplementation(() => {});
      try {
        expect((await kmsg.send(input)).isSuccess).toBe(true);
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(String(consoleError.mock.calls[0]?.[0])).toContain(
          "onSuccess hook threw",
        );
      } finally {
        consoleError.mockRestore();
      }
    });

    test("call method hooks with their own this", async () => {
      class Tracker {
        seen: string[] = [];
        onSuccess(_context: unknown, result: { messageId: string }) {
          this.seen.push(result.messageId);
        }
      }
      const tracker = new Tracker();
      const onHookError = mock(() => {});
      const kmsg = new KMsg({
        providers: [sentProvider()],
        hooks: Object.assign(tracker, { onHookError }),
      });

      const result = await kmsg.send(input);

      expect(result.isSuccess).toBe(true);
      expect(tracker.seen).toHaveLength(1);
      expect(onHookError).not.toHaveBeenCalled();
    });

    test("stay contained when console.error itself throws", async () => {
      const send = mock(async (options: any) =>
        ok({
          messageId: options.messageId,
          status: "SENT" as const,
          providerId: "mock",
          type: options.type,
          to: options.to,
        }),
      );
      const kmsg = new KMsg({
        providers: [sentProvider(send)],
        hooks: {
          onSuccess: () => {
            throw new Error("tracking down");
          },
        },
      });

      const consoleError = spyOn(console, "error").mockImplementation(() => {
        throw new Error("log shim down");
      });
      try {
        const result = await kmsg.send(input);
        expect(result.isSuccess).toBe(true);
        expect(send).toHaveBeenCalledTimes(1);
      } finally {
        consoleError.mockRestore();
      }
    });

    test("end an onboarding failure with onFinal like every other failure", async () => {
      const onError = mock(() => {});
      const onFinal = mock(() => {});
      const send = mock(async () =>
        fail(new KMsgError(KMsgErrorCode.UNKNOWN_ERROR, "unused")),
      );
      const kmsg = new KMsg({
        providers: [
          {
            id: "strict-kakao",
            name: "Strict Kakao",
            supportedTypes: ["ALIMTALK"] as const,
            healthCheck: mock(async () => ({ healthy: true, issues: [] })),
            send,
            getOnboardingSpec: () => ({
              providerId: "strict-kakao",
              channelOnboarding: "none",
              templateLifecycleApi: "unavailable",
              plusIdPolicy: "required_if_no_inference",
              plusIdInference: "unsupported",
              checks: [],
            }),
          },
        ],
        hooks: { onError, onFinal },
      });

      const result = await kmsg.send({
        type: "ALIMTALK",
        to: "01012345678",
        templateId: "TPL_1",
        variables: { code: "1234" },
      });

      expect(result.isFailure).toBe(true);
      expect(send).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onFinal).toHaveBeenCalledTimes(1);
      expect((onFinal.mock.calls[0] as unknown[])[1]).toMatchObject({
        outcome: "failure",
      });
    });

    test("still let onBeforeSend abort the send", async () => {
      const send = mock(async () =>
        fail(new KMsgError(KMsgErrorCode.UNKNOWN_ERROR, "unused")),
      );
      const kmsg = new KMsg({
        providers: [sentProvider(send)],
        hooks: {
          onBeforeSend: () => {
            throw new Error("blocked");
          },
        },
      });

      await expect(kmsg.send(input)).rejects.toThrow("blocked");
      expect(send).not.toHaveBeenCalled();
    });
  });
});

describe("KMsg request context", () => {
  function createCapturingProvider() {
    const contexts: Array<ProviderRequestContext | undefined> = [];
    const provider: Provider = {
      id: "mock",
      name: "Mock Provider",
      supportedTypes: ["SMS"] as const,
      healthCheck: async () => ({ healthy: true, issues: [] }),
      send: async (options, context) => {
        contexts.push(context);
        return ok({
          messageId: options.messageId ?? "test-id",
          status: "SENT" as const,
          providerId: "mock",
          type: options.type,
          to: options.to,
        });
      },
    };
    return { provider, contexts };
  }

  test("forwards the caller's signal and fetch to the provider", async () => {
    const { provider, contexts } = createCapturingProvider();
    const kmsg = new KMsg({ providers: [provider] });
    const request: ProviderRequestContext = {
      signal: new AbortController().signal,
      fetch: async () => new Response("{}"),
    };

    await kmsg.send({ to: "01012345678", text: "one" }, request);
    await kmsg.sendOrThrow({ to: "01012345678", text: "two" }, request);
    await kmsg.send(
      [
        { to: "01011112222", text: "a" },
        { to: "01033334444", text: "b" },
      ],
      request,
    );

    expect(contexts).toHaveLength(4);
    for (const context of contexts) {
      expect(context).toBe(request);
    }
  });

  test("calls the provider without a context when none is given", async () => {
    const { provider, contexts } = createCapturingProvider();
    const kmsg = new KMsg({ providers: [provider] });

    await kmsg.send({ to: "01012345678", text: "one" });

    expect(contexts).toEqual([undefined]);
  });
});

describe("estimateSmsBytes", () => {
  test("counts text the way KMsg chooses between SMS and LMS", async () => {
    expect(estimateSmsBytes("")).toBe(0);
    expect(estimateSmsBytes("hello")).toBe(5);
    expect(estimateSmsBytes("안녕하세요")).toBe(10);
    expect(estimateSmsBytes("주문 #42")).toBe(8);

    const types: string[] = [];
    const provider: Provider = {
      id: "sms",
      name: "SMS",
      supportedTypes: ["SMS", "LMS"] as const,
      healthCheck: async () => ({ healthy: true, issues: [] }),
      send: async (options) => {
        types.push(options.type);
        return ok({
          messageId: options.messageId ?? "id",
          status: "SENT" as const,
          providerId: "sms",
          type: options.type,
          to: options.to,
        });
      },
    };
    const kmsg = new KMsg({ providers: [provider] });
    const ninetyBytes = "가".repeat(45);

    expect(estimateSmsBytes(ninetyBytes)).toBe(90);
    await kmsg.send({ to: "01012345678", text: ninetyBytes });
    await kmsg.send({ to: "01012345678", text: `${ninetyBytes}!` });
    expect(types).toEqual(["SMS", "LMS"]);
  });
});

describe("KMsg ALIMTALK fallback content", () => {
  function createAlimTalkProvider() {
    const sent: SendOptions[] = [];
    const provider: Provider = {
      id: "kakao",
      name: "Kakao",
      supportedTypes: ["ALIMTALK"] as const,
      healthCheck: async () => ({ healthy: true, issues: [] }),
      send: async (options) => {
        sent.push(options);
        return ok({
          messageId: options.messageId ?? "id",
          status: "SENT" as const,
          providerId: "kakao",
          type: options.type,
          to: options.to,
        });
      },
    };
    const failoverOf = (index: number) => {
      const options = sent[index];
      return options?.type === "ALIMTALK" ? options.failover : undefined;
    };
    return { provider, failoverOf };
  }

  test("fills the message variables into the fallback text and title", async () => {
    const { provider, failoverOf } = createAlimTalkProvider();
    const kmsg = new KMsg({ providers: [provider] });
    const input: SendInput = {
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "ORDER_SHIPPED",
      variables: { name: "Kim", orderId: 42 },
      failover: {
        enabled: true,
        fallbackTitle: "#{name}, order #{orderId}",
        fallbackContent: "#{name}, order #{orderId} has shipped #{missing}",
      },
    };

    await kmsg.send(input);

    expect(failoverOf(0)).toEqual({
      enabled: true,
      fallbackChannel: "sms",
      fallbackTitle: "Kim, order 42",
      fallbackContent: "Kim, order 42 has shipped #{missing}",
    });
    // The caller's input is left as it was.
    expect(input.type === "ALIMTALK" && input.failover?.fallbackContent).toBe(
      "#{name}, order #{orderId} has shipped #{missing}",
    );
  });

  test("chooses SMS or LMS for the rendered fallback text when no channel is set", async () => {
    const { provider, failoverOf } = createAlimTalkProvider();
    const kmsg = new KMsg({ providers: [provider] });
    const send = (fallbackContent: string, fallbackChannel?: "sms" | "lms") =>
      kmsg.send({
        type: "ALIMTALK",
        to: "01012345678",
        templateId: "NOTICE",
        variables: { name: "홍길동" },
        failover: {
          enabled: true,
          fallbackContent,
          ...(fallbackChannel ? { fallbackChannel } : {}),
        },
      });

    await send("a".repeat(90));
    await send(`${"가".repeat(45)}!`);
    // 105 bytes as written, but 90 once #{name} is filled in.
    await send("#{name}".repeat(15));
    // A channel the caller chose is kept.
    await send("가".repeat(60), "sms");
    await send("short", "lms");

    expect([0, 1, 2, 3, 4].map((i) => failoverOf(i)?.fallbackChannel)).toEqual([
      "sms",
      "lms",
      "sms",
      "sms",
      "lms",
    ]);
  });

  test("sizes the fallback text against defaults.sms.autoLmsBytes", async () => {
    const { provider, failoverOf } = createAlimTalkProvider();
    const kmsg = new KMsg({
      providers: [provider],
      defaults: { sms: { autoLmsBytes: 50 } },
    });

    await kmsg.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "NOTICE",
      variables: {},
      failover: { enabled: true, fallbackContent: "a".repeat(60) },
    });

    expect(failoverOf(0)?.fallbackChannel).toBe("lms");
  });

  test("leaves failover without fallback text as it is", async () => {
    const { provider, failoverOf } = createAlimTalkProvider();
    const kmsg = new KMsg({ providers: [provider] });

    await kmsg.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "NOTICE",
      variables: { name: "Kim" },
      failover: { enabled: true, fallbackTitle: "Hi #{name}" },
    });

    expect(failoverOf(0)).toEqual({
      enabled: true,
      fallbackTitle: "Hi Kim",
    });
  });
});

describe("KMsg RCS template fallback content", () => {
  test("fills, sizes and passes on the RCS fallback text like AlimTalk's", async () => {
    const sent: SendOptions[] = [];
    const provider: Provider = {
      id: "rcs",
      name: "RCS",
      supportedTypes: ["RCS_TPL"] as const,
      healthCheck: async () => ({ healthy: true, issues: [] }),
      send: async (options) => {
        sent.push(options);
        return ok({
          messageId: options.messageId ?? "id",
          status: "SENT" as const,
          providerId: "rcs",
          type: options.type,
          to: options.to,
        });
      },
    };
    const kmsg = new KMsg({ providers: [provider] });

    for (const fallbackContent of [
      "[#{brand}] code #{code}",
      "가".repeat(46),
    ]) {
      await kmsg.send({
        type: "RCS_TPL",
        to: "01012345678",
        templateId: "OTP",
        variables: { brand: "K-OTP", code: "123456" },
        failover: { enabled: true, fallbackContent },
      });
    }

    const failovers = sent.map((options) =>
      options.type === "RCS_TPL" ? options.failover : undefined,
    );
    expect(failovers).toEqual([
      {
        enabled: true,
        fallbackChannel: "sms",
        fallbackContent: "[K-OTP] code 123456",
      },
      {
        enabled: true,
        fallbackChannel: "lms",
        fallbackContent: "가".repeat(46),
      },
    ]);
  });

  test("fills the fallback from rcs.variables like the RCS message", async () => {
    const sent: SendOptions[] = [];
    const provider: Provider = {
      id: "rcs",
      name: "RCS",
      supportedTypes: ["RCS_TPL"] as const,
      healthCheck: async () => ({ healthy: true, issues: [] }),
      send: async (options) => {
        sent.push(options);
        return ok({
          messageId: options.messageId ?? "id",
          status: "SENT" as const,
          providerId: "rcs",
          type: options.type,
          to: options.to,
        });
      },
    };
    const kmsg = new KMsg({ providers: [provider] });

    await kmsg.send({
      type: "RCS_TPL",
      to: "01012345678",
      templateId: "OTP",
      variables: { brand: "K-OTP", code: "000000" },
      rcs: { variables: { code: "123456" } },
      failover: { enabled: true, fallbackContent: "[#{brand}] code #{code}" },
    });

    const options = sent[0];
    expect(
      options?.type === "RCS_TPL" && options.failover?.fallbackContent,
    ).toBe("[K-OTP] code 123456");
  });
});
