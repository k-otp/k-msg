import { describe, expect, test } from "bun:test";
import { AligoSendProvider } from "./aligo/provider.send";
import { IWINVSendProvider } from "./iwinv/provider.send";
import { MockProvider } from "./providers/mock/mock.provider";
import { SolapiProvider } from "./solapi/provider";

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
      abortSignal: "unsupported",
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
      expect(result.error.code).toBe("REQUEST_ABORTED");
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
      expect(aborted.error.code).toBe("REQUEST_ABORTED");
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
      expect(result.error.code).toBe("NETWORK_TIMEOUT");
      expect(result.error.message).toBe("provider deadline exceeded");
    }
  });
});
