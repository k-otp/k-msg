import { afterEach, describe, expect, test } from "bun:test";
import { AligoProvider } from "./provider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function formDataToObject(
  body: unknown,
): Promise<Record<string, string>> {
  if (!(body instanceof FormData)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of body.entries()) {
    result[key] = typeof value === "string" ? value : String(value);
  }
  return result;
}
describe("AligoProvider scheduling", () => {
  test("sends the reservation as Korea Standard Time", async () => {
    let calledBody: Record<string, string> = {};
    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      calledBody = await formDataToObject(init?.body);
      return new Response(
        JSON.stringify({ result_code: "1", message: "success", msg_id: "7" }),
        { status: 200 },
      );
    };

    const provider = new AligoProvider({ apiKey: "api-key", userId: "user" });
    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      from: "0212345678",
      text: "hello",
      // 00:05 on January 2 in Seoul.
      options: { scheduledAt: new Date("2030-01-01T15:05:00Z") },
    });

    expect(result.isSuccess).toBe(true);
    expect(calledBody.rdate).toBe("20300102");
    expect(calledBody.rtime).toBe("0005");
  });
});
