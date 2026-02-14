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
});
