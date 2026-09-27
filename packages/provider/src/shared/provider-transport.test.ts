import { describe, expect, test } from "bun:test";
import { KMsgError, KMsgErrorCode, type ProviderFetch } from "@k-msg/core";
import {
  fetchWithProviderContext,
  raceProviderAbort,
  toProviderNetworkError,
  toProviderTransportError,
} from "./provider-transport";

describe("shared provider transport", () => {
  test("preserves provider errors and wraps unknown network errors", () => {
    const existing = new KMsgError(KMsgErrorCode.REQUEST_ABORTED, "cancelled");
    expect(toProviderNetworkError(existing, "provider")).toBe(existing);

    const wrapped = toProviderNetworkError(
      new Error("connection failed"),
      "provider",
    );
    expect(wrapped.code).toBe(KMsgErrorCode.NETWORK_ERROR);
    expect(wrapped.message).toBe("connection failed");
    expect(wrapped.details?.providerId).toBe("provider");
  });

  test("reports an unavailable fetch implementation clearly", async () => {
    const error = await fetchWithProviderContext(
      { fetch: {} as ProviderFetch },
      "https://example.invalid",
      { method: "POST" },
      "provider",
    ).then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(KMsgError);
    expect(error).toMatchObject({
      code: KMsgErrorCode.NETWORK_ERROR,
      details: { providerId: "provider" },
    });
    expect((error as Error).message).toContain(
      "No fetch implementation is available",
    );
  });

  test("uses a rejected fetch message for default AbortError reasons", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch: ProviderFetch = async () => {
      throw new Error("transport cancellation detail");
    };

    const error = await fetchWithProviderContext(
      { fetch, signal: controller.signal },
      "https://example.invalid",
      { method: "POST" },
      "provider",
    ).then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toMatchObject({
      code: KMsgErrorCode.REQUEST_ABORTED,
      message: "transport cancellation detail",
    });
  });

  test("preserves an existing provider error during an abort race", async () => {
    const controller = new AbortController();
    controller.abort(new Error("late abort"));
    const existing = new KMsgError(
      KMsgErrorCode.RATE_LIMIT_EXCEEDED,
      "rate limited",
    );
    const fetch: ProviderFetch = async () => {
      throw existing;
    };

    const error = await fetchWithProviderContext(
      { fetch, signal: controller.signal },
      "https://example.invalid",
      { method: "POST" },
      "provider",
    ).then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toBe(existing);
  });

  test("normalizes non-abort fetch failures", async () => {
    const fetch: ProviderFetch = async () => {
      throw new Error("dns lookup failed");
    };

    const error = await fetchWithProviderContext(
      { fetch },
      "https://example.invalid",
      { method: "POST" },
      "provider",
    ).then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toMatchObject({
      code: KMsgErrorCode.NETWORK_ERROR,
      message: "dns lookup failed",
      details: { providerId: "provider" },
    });
  });

  test("classifies failures after fetch resolves from the live signal", () => {
    const controller = new AbortController();
    controller.abort(new Error("response body cancelled"));

    expect(
      toProviderTransportError(
        new DOMException("Aborted", "AbortError"),
        controller.signal,
        "provider",
      ),
    ).toMatchObject({
      code: KMsgErrorCode.REQUEST_ABORTED,
      message: "response body cancelled",
      details: { providerId: "provider" },
    });
  });

  test("stops waiting for an operation that cannot take the signal", async () => {
    const controller = new AbortController();
    let rejectOperation: (reason: unknown) => void = () => {};
    const operation = new Promise<string>((_resolve, reject) => {
      rejectOperation = reject;
    });

    const raced = raceProviderAbort(operation, controller.signal).then(
      () => undefined,
      (reason: unknown) => reason,
    );
    const reason = new Error("deadline exceeded");
    controller.abort(reason);

    expect(await raced).toBe(reason);
    // The operation still settles later; its rejection must not go unhandled.
    rejectOperation(new Error("late transport failure"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  test("passes an operation's outcome through while the signal is live", async () => {
    const controller = new AbortController();

    expect(
      await raceProviderAbort(Promise.resolve("sent"), controller.signal),
    ).toBe("sent");
    expect(await raceProviderAbort(Promise.resolve("sent"), undefined)).toBe(
      "sent",
    );
  });
});
