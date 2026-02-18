import { describe, expect, mock, spyOn, test } from "bun:test";
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageRepository,
  ok,
  type Provider,
  type SendInput,
} from "@k-msg/core";
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
});
