import { describe, expect, test } from "bun:test";
import {
  KMsgErrorCode,
  type ProviderFetch,
  type SendOptions,
} from "@k-msg/core";
import { AligoProvider } from "./provider";

type RecordedCall = { url: string; body: Record<string, string> };

/**
 * Answers Aligo's template list API from `templates` (code -> content) and
 * accepts every AlimTalk send.
 */
function createAligoFetch(templates: Record<string, string>) {
  const calls: RecordedCall[] = [];
  const fetch: ProviderFetch = async (input, init) => {
    const url = String(input);
    const body: Record<string, string> = {};
    if (init?.body instanceof FormData) {
      for (const [key, value] of init.body.entries()) {
        body[key] = String(value);
      }
    }
    calls.push({ url, body });

    if (url.endsWith("/akv10/template/list/")) {
      const code = body.tpl_code ?? "";
      const content = templates[code];
      return Response.json({
        code: 0,
        message: "정상적으로 호출하였습니다.",
        list:
          content === undefined
            ? []
            : [
                {
                  templtCode: code,
                  templtName: "template",
                  templtContent: content,
                  inspStatus: "APR",
                  status: "R",
                  buttons: [],
                },
              ],
      });
    }

    return Response.json({
      code: 0,
      message: "성공적으로 전송요청 하였습니다.",
      info: { type: "AT", mid: 123456789 },
    });
  };

  const sends = () =>
    calls.filter((call) => call.url.endsWith("/akv10/alimtalk/send/"));
  const lookups = () =>
    calls.filter((call) => call.url.endsWith("/akv10/template/list/"));
  return { fetch, sends, lookups };
}

const createProvider = () =>
  new AligoProvider({
    apiKey: "api-key",
    userId: "user",
    senderKey: "SENDERKEY",
    sender: "01000000000",
  });

const alimtalk = (
  overrides: Partial<Extract<SendOptions, { type: "ALIMTALK" }>> = {},
): SendOptions => ({
  type: "ALIMTALK",
  to: "01012345678",
  templateId: "TPL_1",
  variables: {},
  ...overrides,
});

describe("Aligo AlimTalk message", () => {
  test("renders message_1 from the template body by variable name", async () => {
    const aligo = createAligoFetch({
      TPL_1: "#{고객명}님, 주문 #{주문번호}이 발송되었습니다.\r\n감사합니다.",
    });

    const result = await createProvider().send(
      alimtalk({ variables: { 주문번호: "A-1", 고객명: "Jane" } }),
      { fetch: aligo.fetch },
    );

    expect(result.isSuccess).toBe(true);
    expect(aligo.lookups()).toHaveLength(1);
    expect(aligo.lookups()[0]?.body).toMatchObject({
      senderkey: "SENDERKEY",
      tpl_code: "TPL_1",
    });
    expect(aligo.sends()[0]?.body.message_1).toBe(
      "Jane님, 주문 A-1이 발송되었습니다.\r\n감사합니다.",
    );
  });

  test("uses providerOptions.templateContent instead of looking the template up", async () => {
    const aligo = createAligoFetch({});

    const result = await createProvider().send(
      alimtalk({
        variables: { code: "1234" },
        providerOptions: { templateContent: "인증번호는 #{code}입니다." },
      }),
      { fetch: aligo.fetch },
    );

    expect(result.isSuccess).toBe(true);
    expect(aligo.lookups()).toHaveLength(0);
    expect(aligo.sends()[0]?.body.message_1).toBe("인증번호는 1234입니다.");
  });

  test("looks a template up once per provider instance and sender key", async () => {
    const aligo = createAligoFetch({ TPL_1: "#{code}" });
    const provider = createProvider();
    const sendCode = (code: string, profileId?: string) =>
      provider.send(
        alimtalk({
          variables: { code },
          ...(profileId ? { kakao: { profileId } } : {}),
        }),
        { fetch: aligo.fetch },
      );

    const batch = await Promise.all([sendCode("1"), sendCode("2")]);
    const later = await sendCode("3");
    const otherChannel = await sendCode("4", "OTHERKEY");

    expect(
      [...batch, later, otherChannel].every((result) => result.isSuccess),
    ).toBe(true);
    // One lookup for SENDERKEY, one for the other channel.
    expect(aligo.lookups().map((call) => call.body.senderkey)).toEqual([
      "SENDERKEY",
      "OTHERKEY",
    ]);
    expect(
      aligo
        .sends()
        .map((call) => call.body.message_1)
        .sort(),
    ).toEqual(["1", "2", "3", "4"]);
  });

  test("fails before sending when a template variable is missing", async () => {
    const aligo = createAligoFetch({ TPL_1: "#{name}: #{code}" });

    const result = await createProvider().send(
      alimtalk({ variables: { code: "1234" } }),
      { fetch: aligo.fetch },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toContain("name");
    }
    expect(aligo.sends()).toHaveLength(0);
  });

  test("fails with TEMPLATE_NOT_FOUND when the template does not exist", async () => {
    const aligo = createAligoFetch({});

    const result = await createProvider().send(
      alimtalk({ variables: { code: "1234" } }),
      { fetch: aligo.fetch },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.TEMPLATE_NOT_FOUND);
    }
    expect(aligo.sends()).toHaveLength(0);
  });

  test("looks up a template without variables too", async () => {
    const aligo = createAligoFetch({ TPL_1: "공지: 점검이 완료되었습니다." });

    const result = await createProvider().send(alimtalk(), {
      fetch: aligo.fetch,
    });

    expect(result.isSuccess).toBe(true);
    expect(aligo.sends()[0]?.body.message_1).toBe(
      "공지: 점검이 완료되었습니다.",
    );
  });
});
