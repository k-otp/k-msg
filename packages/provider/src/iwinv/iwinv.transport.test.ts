import { describe, expect, test } from "bun:test";
import type {
  DeliveryStatusQuery,
  ProviderFetch,
  SendOptions,
} from "@k-msg/core";
import { IWINVSendProvider } from "./provider.send";

const createProvider = () =>
  new IWINVSendProvider({
    apiKey: "alimtalk-api-key",
    smsApiKey: "sms-api-key",
    smsAuthKey: "sms-auth-key",
    smsCompanyId: "company-id",
  });

const sendInputs: SendOptions[] = [
  {
    type: "ALIMTALK",
    to: "01012345678",
    templateId: "TPL_1",
    variables: { code: "123456" },
  },
  {
    type: "SMS",
    to: "01012345678",
    from: "01000000000",
    text: "short message",
  },
  {
    type: "LMS",
    to: "01012345678",
    from: "01000000000",
    text: "long message",
    subject: "subject",
  },
  {
    type: "MMS",
    to: "01012345678",
    from: "01000000000",
    text: "multimedia message",
    media: {
      image: {
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
        filename: "test.jpg",
        contentType: "image/jpeg",
      },
    },
  },
];

describe("IWINV transport context", () => {
  test("forwards the same signal and injected fetch for every send channel", async () => {
    const provider = createProvider();
    const controller = new AbortController();
    const observedSignals: Array<AbortSignal | null | undefined> = [];

    const fetch: ProviderFetch = async (input, init) => {
      observedSignals.push(init?.signal);
      const isAlimTalk = String(input).includes("alimtalk.bizservice.iwinv.kr");
      return new Response(
        JSON.stringify(
          isAlimTalk
            ? { code: 200, message: "ok", seqNo: 1 }
            : { resultCode: 0, message: "ok", requestNo: "request-1" },
        ),
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

  test("forwards the same signal and injected fetch for both history transports", async () => {
    const provider = createProvider();
    const controller = new AbortController();
    const observedSignals: Array<AbortSignal | null | undefined> = [];

    const fetch: ProviderFetch = async (input, init) => {
      observedSignals.push(init?.signal);
      const isAlimTalk = String(input).includes("alimtalk.bizservice.iwinv.kr");
      return new Response(
        JSON.stringify(
          isAlimTalk
            ? { code: 200, message: "ok", list: [] }
            : { resultCode: 0, message: "ok", list: [] },
        ),
        { status: 200 },
      );
    };

    const baseQuery = {
      providerMessageId: "provider-message-1",
      to: "01012345678",
      requestedAt: new Date(),
    };
    const queries: DeliveryStatusQuery[] = [
      { ...baseQuery, type: "ALIMTALK" },
      { ...baseQuery, type: "SMS" },
    ];

    for (const query of queries) {
      const result = await provider.getDeliveryStatus(query, {
        signal: controller.signal,
        fetch,
      });
      expect(result.isSuccess).toBe(true);
    }

    expect(observedSignals).toEqual([controller.signal, controller.signal]);
  });

  test("settles only after an aborted fetch rejects", async () => {
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

    let settled = false;
    void resultPromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    controller.abort(new Error("provider deadline exceeded"));
    const result = await resultPromise;

    expect(fetchRejected).toBe(true);
    expect(settled).toBe(true);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("REQUEST_ABORTED");
      expect(result.error.message).toBe("provider deadline exceeded");
    }
  });

  test("classifies aborts while reading every send response body", async () => {
    const provider = createProvider();
    const bodyParsingInputs = [sendInputs[0], sendInputs[1], sendInputs[3]];

    for (const input of bodyParsingInputs) {
      const controller = new AbortController();
      const fetch: ProviderFetch = async () =>
        ({
          ok: true,
          status: 200,
          text: async () => {
            controller.abort(new Error("send response body cancelled"));
            throw new DOMException("Aborted", "AbortError");
          },
        }) as Response;

      const result = await provider.send(input as SendOptions, {
        signal: controller.signal,
        fetch,
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.code).toBe("REQUEST_ABORTED");
        expect(result.error.message).toBe("send response body cancelled");
      }
    }
  });

  test("classifies aborts while reading every history response body", async () => {
    const provider = createProvider();
    const baseQuery = {
      providerMessageId: "provider-message-1",
      to: "01012345678",
      requestedAt: new Date(),
    };
    const queries: DeliveryStatusQuery[] = [
      { ...baseQuery, type: "ALIMTALK" },
      { ...baseQuery, type: "SMS" },
    ];

    for (const query of queries) {
      const controller = new AbortController();
      const fetch: ProviderFetch = async () =>
        ({
          ok: true,
          status: 200,
          text: async () => {
            controller.abort(new Error("history response body cancelled"));
            throw new DOMException("Aborted", "AbortError");
          },
        }) as Response;

      const result = await provider.getDeliveryStatus(query, {
        signal: controller.signal,
        fetch,
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.code).toBe("REQUEST_ABORTED");
        expect(result.error.message).toBe("history response body cancelled");
      }
    }
  });
});
