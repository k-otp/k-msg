import { describe, expect, test } from "bun:test";
import { AligoProvider } from "./provider";

function isEnabled(): boolean {
  return Bun.env.KMSG_LIVE_ALIGO_ENABLED === "true";
}

function required(key: string): string {
  const value = Bun.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env for live test: ${key}`);
  }
  return value;
}

describe("AligoProvider live integration", () => {
  test("health + channel/template smoke", async () => {
    if (!isEnabled()) {
      expect(true).toBe(true);
      return;
    }

    const provider = new AligoProvider({
      apiKey: required("ALIGO_API_KEY"),
      userId: required("ALIGO_USER_ID"),
      senderKey: Bun.env.ALIGO_SENDER_KEY,
      sender: Bun.env.ALIGO_SENDER,
      smsBaseUrl: Bun.env.ALIGO_SMS_BASE_URL,
      alimtalkBaseUrl: Bun.env.ALIGO_ALIMTALK_BASE_URL,
    });

    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);

    const channels = await provider.listKakaoChannels();
    expect(channels.isSuccess).toBe(true);

    const senderKey = Bun.env.ALIGO_SENDER_KEY;
    if (!senderKey || senderKey.trim().length === 0) {
      return;
    }

    const listed = await provider.listTemplates(
      { page: 1, limit: 1 },
      {
        kakaoChannelSenderKey: senderKey,
      },
    );
    expect(listed.isSuccess).toBe(true);

    if (Bun.env.KMSG_LIVE_ALIGO_ALLOW_MUTATION !== "true") {
      return;
    }

    const token = Date.now().toString().slice(-6);
    const created = await provider.createTemplate(
      {
        name: `kmsg${token}`,
        content: `live test ${token} #{code}`,
      },
      { kakaoChannelSenderKey: senderKey },
    );
    expect(created.isSuccess).toBe(true);
  });
});
