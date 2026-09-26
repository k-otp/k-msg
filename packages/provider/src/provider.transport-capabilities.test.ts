import { describe, expect, test } from "bun:test";
import { ErrorUtils, KMsgErrorCode } from "@k-msg/core";
import { AligoSendProvider } from "./aligo/provider.send";
import { IWINVSendProvider } from "./iwinv/provider.send";
import { MockProvider } from "./providers/mock/mock.provider";
import { SolapiProvider } from "./solapi/provider";
import type { SolapiSdkClient } from "./solapi/solapi.internal.types";

/** A SOLAPI SDK stand-in whose calls settle only when the test says so. */
function createPendingSolapiClient() {
  const calls = { sendOne: 0, uploadFile: 0, getMessages: 0 };
  const pending: Array<(value: unknown) => void> = [];
  const hold = <T>() =>
    new Promise<T>((resolve) => {
      pending.push(resolve as (value: unknown) => void);
    });

  const client: SolapiSdkClient = {
    sendOne: async () => {
      calls.sendOne += 1;
      return hold();
    },
    uploadFile: async () => {
      calls.uploadFile += 1;
      return hold();
    },
    getMessages: async () => {
      calls.getMessages += 1;
      return hold();
    },
    getBalance: async () => hold(),
  };

  return {
    client,
    calls,
    /** Lets every held SDK call finish, as the real request would. */
    releaseAll(value: unknown) {
      for (const resolve of pending.splice(0)) resolve(value);
    },
  };
}

/** Lets every pending promise callback run, like an event-loop turn. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function createSolapiProvider(client: SolapiSdkClient) {
  return new SolapiProvider(
    { apiKey: "api-key", apiSecret: "api-secret", defaultFrom: "01000000000" },
    client,
  );
}

describe("built-in provider transport capabilities", () => {
  test("declare support according to their actual transport", () => {
    const iwinv = new IWINVSendProvider({ apiKey: "api-key" });
    const aligo = new AligoSendProvider({
      apiKey: "api-key",
      userId: "user-id",
    });
    const solapi = new SolapiProvider({
      apiKey: "api-key",
      apiSecret: "api-secret",
    });
    const mock = new MockProvider();

    expect(iwinv.transportCapabilities).toEqual({
      abortSignal: "supported",
      injectableFetch: "supported",
    });
    expect(aligo.transportCapabilities).toEqual({
      abortSignal: "supported",
      injectableFetch: "supported",
    });
    expect(solapi.transportCapabilities).toEqual({
      abortSignal: "supported",
      injectableFetch: "unsupported",
    });
    expect(mock.transportCapabilities).toEqual({
      abortSignal: "supported",
      injectableFetch: "unsupported",
    });
  });

  test("mock provider aborts simulated transport delay", async () => {
    const provider = new MockProvider();
    provider.mockScenario([
      { outcome: "delay", durationMs: 10_000 },
      { outcome: "success" },
    ]);
    const controller = new AbortController();
    const resultPromise = provider.send(
      { type: "SMS", to: "01012345678", text: "message" },
      { signal: controller.signal },
    );

    controller.abort(new Error("mock deadline exceeded"));
    const result = await resultPromise;

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
      expect(result.error.message).toBe("mock deadline exceeded");
    }
  });

  test("mock provider rejects a pre-aborted send without consuming a scenario", async () => {
    const provider = new MockProvider();
    provider.mockScenario([{ outcome: "success" }]);
    const controller = new AbortController();
    controller.abort(new Error("cancelled before send"));

    const aborted = await provider.send(
      { type: "SMS", to: "01012345678", text: "message" },
      { signal: controller.signal },
    );
    const next = await provider.send({
      type: "SMS",
      to: "01012345678",
      text: "message",
    });

    expect(aborted.isFailure).toBe(true);
    if (aborted.isFailure) {
      expect(aborted.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
      expect(aborted.error.message).toBe("cancelled before send");
    }
    expect(next.isSuccess).toBe(true);
    expect(provider.calls).toHaveLength(1);
  });

  test("mock provider preserves timeout abort reasons as retryable timeouts", async () => {
    const provider = new MockProvider();
    provider.mockScenario([
      { outcome: "delay", durationMs: 10_000 },
      { outcome: "success" },
    ]);
    const controller = new AbortController();
    const timeout = Object.assign(new Error("provider deadline exceeded"), {
      code: "NETWORK_TIMEOUT",
    });
    const resultPromise = provider.send(
      { type: "SMS", to: "01012345678", text: "message" },
      { signal: controller.signal },
    );

    controller.abort(timeout);
    const result = await resultPromise;

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.NETWORK_TIMEOUT);
      expect(result.error.message).toBe("provider deadline exceeded");
    }
  });

  test("solapi provider rejects a pre-aborted send without calling the SDK", async () => {
    const sdk = createPendingSolapiClient();
    const controller = new AbortController();
    controller.abort(new Error("cancelled before send"));

    const result = await createSolapiProvider(sdk.client).send(
      { type: "SMS", to: "01012345678", text: "message" },
      { signal: controller.signal },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
      expect(result.error.message).toBe("cancelled before send");
    }
    expect(sdk.calls.sendOne).toBe(0);
  });

  test("solapi provider stops waiting for the SDK once the signal aborts", async () => {
    const sdk = createPendingSolapiClient();
    const controller = new AbortController();
    const timeout = Object.assign(new Error("provider deadline exceeded"), {
      code: "NETWORK_TIMEOUT",
    });

    const resultPromise = createSolapiProvider(sdk.client).send(
      { type: "SMS", to: "01012345678", text: "message" },
      { signal: controller.signal },
    );
    await settle();
    expect(sdk.calls.sendOne).toBe(1);

    controller.abort(timeout);
    const result = await resultPromise;

    // The SDK request already went out and cannot be cancelled, so SOLAPI may
    // still send the message. REQUEST_ABORTED is not retried by default,
    // where a retried NETWORK_TIMEOUT could reach the customer twice.
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
      expect(ErrorUtils.isRetryable(result.error)).toBe(false);
      expect(result.error.message).toContain("provider deadline exceeded");
      expect(result.error.details?.requestSent).toBe(true);
    }
    sdk.releaseAll({ messageId: "msg_late" });
    await settle();
  });

  test("solapi provider keeps a timeout before the send retryable", async () => {
    const sdk = createPendingSolapiClient();
    const controller = new AbortController();
    const timeout = Object.assign(new Error("provider deadline exceeded"), {
      code: "NETWORK_TIMEOUT",
    });

    const resultPromise = createSolapiProvider(sdk.client).send(
      {
        type: "MMS",
        to: "01012345678",
        text: "message",
        imageUrl: "https://example.com/image.jpg",
      },
      { signal: controller.signal },
    );
    await settle();
    controller.abort(timeout);
    const result = await resultPromise;

    // Nothing was sent: the abort came during the image upload.
    expect(sdk.calls.sendOne).toBe(0);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.NETWORK_TIMEOUT);
    }
    sdk.releaseAll({ fileId: "MMS_file_1" });
    await settle();
  });

  test("solapi provider does not send after an upload the signal aborted", async () => {
    const sdk = createPendingSolapiClient();
    const controller = new AbortController();

    const resultPromise = createSolapiProvider(sdk.client).send(
      {
        type: "MMS",
        to: "01012345678",
        text: "message",
        imageUrl: "https://example.com/image.jpg",
      },
      { signal: controller.signal },
    );
    await settle();
    expect(sdk.calls.uploadFile).toBe(1);

    controller.abort(new Error("cancelled during upload"));
    const result = await resultPromise;
    sdk.releaseAll({ fileId: "MMS_file_1" });
    await settle();

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
    }
    expect(sdk.calls.sendOne).toBe(0);
  });

  test("solapi provider uploads no more fax files once the signal aborts", async () => {
    const sdk = createPendingSolapiClient();
    const controller = new AbortController();

    const resultPromise = createSolapiProvider(sdk.client).send(
      {
        type: "FAX",
        to: "01012345678",
        fax: {
          fileUrls: ["https://example.com/a.pdf", "https://example.com/b.pdf"],
        },
      },
      { signal: controller.signal },
    );
    await settle();
    expect(sdk.calls.uploadFile).toBe(1);

    controller.abort(new Error("cancelled during upload"));
    const result = await resultPromise;
    // The pending upload finishes afterwards; the second must not start.
    sdk.releaseAll({ fileId: "FAX_file_1" });
    await settle();

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
    }
    expect(sdk.calls.uploadFile).toBe(1);
    expect(sdk.calls.sendOne).toBe(0);
  });

  test("solapi delivery status observes the signal", async () => {
    const sdk = createPendingSolapiClient();
    const provider = createSolapiProvider(sdk.client);
    const query = {
      providerMessageId: "msg_1",
      type: "SMS" as const,
      to: "01012345678",
      requestedAt: new Date(),
    };

    const preAborted = new AbortController();
    preAborted.abort(new Error("cancelled before lookup"));
    const skipped = await provider.getDeliveryStatus(query, {
      signal: preAborted.signal,
    });
    expect(sdk.calls.getMessages).toBe(0);

    const controller = new AbortController();
    const pending = provider.getDeliveryStatus(query, {
      signal: controller.signal,
    });
    await settle();
    controller.abort(new Error("cancelled during lookup"));
    const aborted = await pending;
    sdk.releaseAll({ messageList: {} });

    for (const result of [skipped, aborted]) {
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.code).toBe(KMsgErrorCode.REQUEST_ABORTED);
      }
    }
    expect(sdk.calls.getMessages).toBe(1);
  });
});
