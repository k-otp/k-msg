import { describe, expect, test } from "bun:test";
import { SolapiProvider } from "./provider";

function isEnabled(): boolean {
  return Bun.env.KMSG_LIVE_SOLAPI_ENABLED === "true";
}

function required(key: string): string {
  const value = Bun.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env for live test: ${key}`);
  }
  return value;
}

describe("SolapiProvider live integration", () => {
  test("health + delivery status lookup smoke", async () => {
    if (!isEnabled()) {
      expect(true).toBe(true);
      return;
    }

    const provider = new SolapiProvider({
      apiKey: required("SOLAPI_API_KEY"),
      apiSecret: required("SOLAPI_API_SECRET"),
      kakaoPfId: Bun.env.SOLAPI_KAKAO_PF_ID,
      defaultFrom: Bun.env.SOLAPI_DEFAULT_FROM,
      baseUrl: Bun.env.SOLAPI_BASE_URL,
    });

    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);

    const lookedUp = await provider.getDeliveryStatus({
      type: "ALIMTALK",
      providerMessageId:
        Bun.env.SOLAPI_PROBE_MESSAGE_ID ?? "non-existent-message-id",
      to: Bun.env.SOLAPI_PROBE_TO ?? "01000000000",
      requestedAt: new Date(Date.now() - 60 * 60 * 1000),
    });

    expect(lookedUp.isSuccess).toBe(true);
  });
});
