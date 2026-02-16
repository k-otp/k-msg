import { describe, expect, test } from "bun:test";
import { IWINVProvider } from "./provider";

function isEnabled(): boolean {
  return Bun.env.KMSG_LIVE_IWINV_ENABLED === "true";
}

function required(key: string): string {
  const value = Bun.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env for live test: ${key}`);
  }
  return value;
}

describe("IWINVProvider live integration", () => {
  test("health + template lifecycle smoke", async () => {
    if (!isEnabled()) {
      expect(true).toBe(true);
      return;
    }

    const provider = new IWINVProvider({
      apiKey: required("IWINV_API_KEY"),
      smsApiKey: Bun.env.IWINV_SMS_API_KEY,
      smsAuthKey: Bun.env.IWINV_SMS_AUTH_KEY,
      smsCompanyId: Bun.env.IWINV_SMS_COMPANY_ID,
      senderNumber: Bun.env.IWINV_SENDER_NUMBER,
    });

    const health = await provider.healthCheck();
    expect(health.healthy).toBe(true);

    const listed = await provider.listTemplates({ page: 1, limit: 1 });
    expect(listed.isSuccess).toBe(true);

    if (Bun.env.KMSG_LIVE_IWINV_ALLOW_MUTATION !== "true") {
      return;
    }

    const token = Date.now().toString().slice(-6);
    const created = await provider.createTemplate({
      name: `kmsg${token}`,
      content: `live test ${token} #{code}`,
    });
    expect(created.isSuccess).toBe(true);
    if (created.isFailure) return;

    const code = created.value.code;
    const fetched = await provider.getTemplate(code);
    expect(fetched.isSuccess).toBe(true);

    const removed = await provider.deleteTemplate(code);
    expect(removed.isSuccess).toBe(true);
  });
});
