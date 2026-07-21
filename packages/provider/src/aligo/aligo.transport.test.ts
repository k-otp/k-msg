import { describe, expect, test } from "bun:test";
import type { ProviderFetch, SendOptions } from "@k-msg/core";
import { AligoSendProvider } from "./provider.send";

const createProvider = () =>
  new AligoSendProvider({
    apiKey: "api-key",
    userId: "user-id",
    senderKey: "sender-key",
    sender: "01000000000",
    testMode: true,
  });

const sendInputs: SendOptions[] = [
  {
    type: "SMS",
    to: "01012345678",
    text: "short message",
  },
  {
    type: "LMS",
    to: "01012345678",
    text: "long message",
    subject: "subject",
  },
  {
    type: "MMS",
    to: "01012345678",
    text: "multimedia message",
    imageUrl: "https://example.com/image.jpg",
  },
  {
    type: "ALIMTALK",
    to: "01012345678",
    templateId: "TPL_1",
    variables: { code: "123456" },
    providerOptions: { templateContent: "code: #{code}" },
  },
  {
    type: "FRIENDTALK",
    to: "01012345678",
    text: "friend message",
  },
];

describe("Aligo transport context", () => {
  test("forwards the same signal and injected fetch for every send channel", async () => {
    const provider = createProvider();
    const controller = new AbortController();
    const observedSignals: Array<AbortSignal | null | undefined> = [];

    const fetch: ProviderFetch = async (input, init) => {
      observedSignals.push(init?.signal);
      const isSms = String(input).includes("apis.aligo.in");
      return new Response(
        JSON.stringify({
          result_code: isSms ? "1" : "0",
          message: "ok",
          msg_id: "message-1",
        }),
        { status: 200 },
      );
    };

    for (const input of sendInputs) {
      const result = await provider.send(input, {
        signal: controller.signal,
        fetch,
      });
      expect(result.isSuccess).toBe(true);
    }

    expect(observedSignals).toHaveLength(sendInputs.length);
    expect(
      observedSignals.every((signal) => signal === controller.signal),
    ).toBe(true);
  });

  test("settles after an aborted fetch rejects", async () => {
    const provider = createProvider();
    const controller = new AbortController();
    let fetchRejected = false;

    const fetch: ProviderFetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const rejectFromAbort = () => {
          fetchRejected = true;
          reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
        };

        if (signal?.aborted) {
          rejectFromAbort();
          return;
        }
        signal?.addEventListener("abort", rejectFromAbort, { once: true });
      });

    const resultPromise = provider.send(sendInputs[0] as SendOptions, {
      signal: controller.signal,
      fetch,
    });
    controller.abort(new Error("provider deadline exceeded"));
    const result = await resultPromise;

    expect(fetchRejected).toBe(true);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("REQUEST_ABORTED");
      expect(result.error.message).toBe("provider deadline exceeded");
    }
  });

  test("classifies aborts while reading a response body", async () => {
    const provider = createProvider();
    const controller = new AbortController();
    const fetch: ProviderFetch = async () =>
      ({
        ok: true,
        status: 200,
        json: async () => {
          controller.abort(new Error("response body cancelled"));
          throw new DOMException("Aborted", "AbortError");
        },
      }) as Response;

    const result = await provider.send(sendInputs[0] as SendOptions, {
      signal: controller.signal,
      fetch,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("REQUEST_ABORTED");
      expect(result.error.message).toBe("response body cancelled");
    }
  });
});
