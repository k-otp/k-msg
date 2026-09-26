import { describe, expect, test } from "bun:test";
import {
  KMsgErrorCode,
  type ProviderFetch,
  type SendOptions,
} from "@k-msg/core";
import { IWINVProvider } from "./provider";

type RecordedCall = { url: string; body: Record<string, unknown> };

/**
 * Answers IWINV's template list API from `templates` (code -> content) and
 * accepts every send.
 */
function createIwinvFetch(templates: Record<string, string>) {
  const calls: RecordedCall[] = [];
  const fetch: ProviderFetch = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<
      string,
      unknown
    >;
    calls.push({ url, body });

    if (url.endsWith("/api/template/")) {
      const code = String(body.templateCode ?? "");
      const content = templates[code];
      return Response.json({
        code: 200,
        message: "ok",
        totalCount: content === undefined ? 0 : 1,
        list:
          content === undefined
            ? []
            : [
                {
                  templateCode: code,
                  templateName: "template",
                  templateContent: content,
                  status: "Y",
                  createDate: "2026-01-01 00:00:00",
                  buttons: [],
                },
              ],
      });
    }

    return Response.json({ code: 200, message: "ok", seqNo: 1 });
  };

  const sends = () => calls.filter((call) => call.url.endsWith("/send/"));
  const lookups = () =>
    calls.filter((call) => call.url.endsWith("/api/template/"));
  return { fetch, calls, sends, lookups };
}

function templateParamOf(call: RecordedCall | undefined): unknown {
  const list = call?.body.list;
  if (!Array.isArray(list)) return undefined;
  const first = list[0] as Record<string, unknown> | undefined;
  return first?.templateParam;
}

const alimtalk = (
  overrides: Partial<Extract<SendOptions, { type: "ALIMTALK" }>> = {},
): SendOptions => ({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "TPL_1",
  variables: {},
  ...overrides,
});

describe("IWINV AlimTalk template variables", () => {
  test("fills templateParam by variable name, in template order", async () => {
    const iwinv = createIwinvFetch({
      TPL_1: "#{name}님, 인증번호는 #{code}입니다.",
    });
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({ variables: { code: "1234", name: "Jane" } }),
      { fetch: iwinv.fetch },
    );

    expect(result.isSuccess).toBe(true);
    expect(iwinv.lookups()).toHaveLength(1);
    expect(iwinv.lookups()[0]?.body.templateCode).toBe("TPL_1");
    expect(templateParamOf(iwinv.sends()[0])).toEqual(["Jane", "1234"]);
  });

  test("repeats a value for every occurrence of its placeholder", async () => {
    const iwinv = createIwinvFetch({
      TPL_1: "#{name}님 안녕하세요. #{name}님의 코드는 #{code}입니다.",
    });
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({ variables: { code: 7, name: "Jane" } }),
      { fetch: iwinv.fetch },
    );

    expect(result.isSuccess).toBe(true);
    expect(templateParamOf(iwinv.sends()[0])).toEqual(["Jane", "Jane", "7"]);
  });

  test("uses providerOptions.templateContent instead of looking the template up", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({
        variables: { code: "1234", name: "Jane" },
        providerOptions: { templateContent: "#{name}: #{code}" },
      }),
      { fetch: iwinv.fetch },
    );

    expect(result.isSuccess).toBe(true);
    expect(iwinv.lookups()).toHaveLength(0);
    expect(templateParamOf(iwinv.sends()[0])).toEqual(["Jane", "1234"]);
  });

  test("keeps providerOptions.templateParam as an explicit override", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({
        variables: { code: "1234" },
        providerOptions: { templateParam: ["A", "B"] },
      }),
      { fetch: iwinv.fetch },
    );

    expect(result.isSuccess).toBe(true);
    expect(iwinv.lookups()).toHaveLength(0);
    expect(templateParamOf(iwinv.sends()[0])).toEqual(["A", "B"]);
  });

  test("looks a template up once per provider instance", async () => {
    const iwinv = createIwinvFetch({ TPL_1: "#{code}" });
    const provider = new IWINVProvider({ apiKey: "api-key" });
    const sendCode = (code: string) =>
      provider.send(alimtalk({ variables: { code } }), { fetch: iwinv.fetch });

    // Concurrent sends of a batch share one lookup; later sends reuse it.
    const batch = await Promise.all([sendCode("1"), sendCode("2")]);
    const later = await sendCode("3");

    expect(batch.every((result) => result.isSuccess)).toBe(true);
    expect(later.isSuccess).toBe(true);
    expect(iwinv.lookups()).toHaveLength(1);
    expect(
      iwinv
        .sends()
        .map(templateParamOf)
        .map((param) => JSON.stringify(param))
        .sort(),
    ).toEqual(['["1"]', '["2"]', '["3"]']);
  });

  test("fails before sending when a template variable is missing", async () => {
    const iwinv = createIwinvFetch({ TPL_1: "#{name}: #{code}" });
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({ variables: { code: "1234" } }),
      { fetch: iwinv.fetch },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toContain("name");
    }
    expect(iwinv.sends()).toHaveLength(0);
  });

  test("fails with TEMPLATE_NOT_FOUND when the template does not exist", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({ variables: { code: "1234" } }),
      { fetch: iwinv.fetch },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.TEMPLATE_NOT_FOUND);
    }
    expect(iwinv.sends()).toHaveLength(0);
  });

  test("sends no templateParam and skips the lookup without variables", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(alimtalk(), { fetch: iwinv.fetch });

    expect(result.isSuccess).toBe(true);
    expect(iwinv.lookups()).toHaveLength(0);
    expect(templateParamOf(iwinv.sends()[0])).toBeUndefined();
  });
});

describe("IWINV AlimTalk resend (fallback) fields", () => {
  const withTemplate = { providerOptions: { templateContent: "#{code}" } };

  test("sends failover.fallbackContent as direct-input resend content", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({
        ...withTemplate,
        from: "01000000000",
        variables: { code: "1234" },
        failover: {
          enabled: true,
          fallbackChannel: "lms",
          fallbackTitle: "fallback title",
          fallbackContent: "fallback body",
        },
      }),
      { fetch: iwinv.fetch },
    );

    expect(result.isSuccess).toBe(true);
    const body = iwinv.sends()[0]?.body;
    expect(body?.reSend).toBe("Y");
    // "N" is IWINV's direct-input type; "Y" would resend the AlimTalk text.
    expect(body?.resendType).toBe("N");
    expect(body?.resendTitle).toBe("fallback title");
    expect(body?.resendContent).toBe("fallback body");
  });

  test("resends the AlimTalk text when no fallback content is given", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({
        ...withTemplate,
        from: "01000000000",
        variables: { code: "1234" },
        failover: { enabled: true, fallbackChannel: "sms" },
      }),
      { fetch: iwinv.fetch },
    );

    expect(result.isSuccess).toBe(true);
    const body = iwinv.sends()[0]?.body;
    expect(body?.reSend).toBe("Y");
    // IWINV's default resendType ("Y") resends the AlimTalk text.
    expect(body?.resendType).toBeUndefined();
    expect(body?.resendContent).toBeUndefined();
  });

  test("rejects a direct-input resendType without resend content", async () => {
    const iwinv = createIwinvFetch({});
    const provider = new IWINVProvider({ apiKey: "api-key" });

    const result = await provider.send(
      alimtalk({
        from: "01000000000",
        variables: { code: "1234" },
        providerOptions: { templateContent: "#{code}", resendType: "N" },
      }),
      { fetch: iwinv.fetch },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toContain("resendContent");
    }
    expect(iwinv.sends()).toHaveLength(0);
  });
});
