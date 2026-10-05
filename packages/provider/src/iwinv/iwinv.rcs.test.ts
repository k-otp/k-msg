import { describe, expect, test } from "bun:test";
import {
  KMsgErrorCode,
  type ProviderFetch,
  type RcsTemplateSendOptions,
  type SendOptions,
} from "@k-msg/core";
import { resolveIwinvMessageTypes } from "./iwinv.capabilities";
import { mapIwinvRcsHistoryStatus } from "./iwinv.rcs";
import { getIWINVSendErrorReason } from "./iwinv.send-error";
import { IWINVSendProvider } from "./provider.send";
import type { IWINVConfig } from "./types/iwinv";

const RCS_KEY = "rcs-api-key";
const SEND_URL = "https://rcs.bizservice.iwinv.kr/api/v1/send/";
const HISTORY_URL = "https://rcs.bizservice.iwinv.kr/api/v1/history/";
const CORRELATION_ID = "iwinv-rcs:BR.brand01:UBR.otp01";

const createProvider = (config: IWINVConfig = {}) =>
  new IWINVSendProvider({
    rcsApiKey: RCS_KEY,
    rcsBrandId: "BR.brand01",
    senderNumber: "1588-0000",
    ...config,
  });

const rcs = (overrides: Partial<RcsTemplateSendOptions> = {}): SendOptions => ({
  type: "RCS_TPL",
  to: "010-1234-5678",
  templateId: "UBR.otp01",
  variables: { code: "123456" },
  ...overrides,
});

interface Captured {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function recordingFetch(responses: Array<{ body: string; status?: number }>): {
  fetch: ProviderFetch;
  calls: Captured[];
} {
  const calls: Captured[] = [];
  let index = 0;
  const fetch: ProviderFetch = async (input, init) => {
    calls.push({
      url: String(input),
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    const response = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return new Response(response?.body ?? "", {
      status: response?.status ?? 200,
    });
  };
  return { fetch, calls };
}

const accepted = JSON.stringify({
  code: 200,
  message: "메시지가 발송되었습니다",
  success: 1,
  fail: 0,
});

async function sendOk(options: SendOptions, config?: IWINVConfig) {
  const { fetch, calls } = recordingFetch([{ body: accepted }]);
  const result = await createProvider(config).send(options, { fetch });
  if (result.isFailure) throw result.error;
  return { result: result.value, call: calls[0] as Captured };
}

async function sendError(
  options: SendOptions,
  body: string,
  status = 200,
  config?: IWINVConfig,
) {
  const { fetch, calls } = recordingFetch([{ body, status }]);
  const result = await createProvider(config).send(options, { fetch });
  if (result.isSuccess) throw new Error("expected the send to fail");
  return { error: result.error, calls };
}

describe("IWINV RCS capability", () => {
  test("rcsApiKey alone enables RCS_TPL only", () => {
    expect(resolveIwinvMessageTypes({ rcsApiKey: RCS_KEY })).toEqual([
      "RCS_TPL",
    ]);
    expect(
      new IWINVSendProvider({ rcsApiKey: RCS_KEY }).supportedTypes,
    ).toEqual(["RCS_TPL"]);
    expect(
      resolveIwinvMessageTypes({
        apiKey: "a",
        smsApiKey: "s",
        smsAuthKey: "k",
        rcsApiKey: RCS_KEY,
      }),
    ).toEqual(["ALIMTALK", "SMS", "LMS", "MMS", "RCS_TPL"]);
    expect(resolveIwinvMessageTypes({ apiKey: "a" })).not.toContain("RCS_TPL");
  });

  test("other RCS types are not supported", async () => {
    const { fetch, calls } = recordingFetch([{ body: accepted }]);
    const result = await createProvider().send(
      { ...rcs(), type: "RCS_LTPL" } as SendOptions,
      { fetch },
    );

    expect(result.isFailure && result.error.code).toBe(
      KMsgErrorCode.INVALID_REQUEST,
    );
    expect(calls).toHaveLength(0);
  });
});

describe("IWINV RCS send", () => {
  test("posts the template send with the RCS key and named variables", async () => {
    const { result, call } = await sendOk(
      rcs({
        variables: {
          code: 123456,
          name: null,
          skipped: undefined,
          at: new Date("2026-10-05T00:00:00.000Z"),
        },
        rcs: { variables: { brand: "K-OTP" } },
      }),
    );

    expect(call.url).toBe(SEND_URL);
    expect(call.headers.auth).toBe(btoa(RCS_KEY));
    expect(call.headers["content-type"]).toBe("application/json;charset=UTF-8");
    expect(call.body).toEqual({
      brandId: "BR.brand01",
      templateCode: "UBR.otp01",
      callback: "15880000",
      reserve: "N",
      list: [
        {
          phone: "01012345678",
          templateParam: {
            code: "123456",
            name: "",
            at: "2026-10-05T00:00:00.000Z",
            brand: "K-OTP",
          },
        },
      ],
      reSend: "N",
    });
    expect(result).toMatchObject({
      providerId: "iwinv",
      providerMessageId: CORRELATION_ID,
      status: "SENT",
      type: "RCS_TPL",
      to: "010-1234-5678",
    });
  });

  test("options override the configured brand, template and sender", async () => {
    const { call, result } = await sendOk(
      rcs({
        from: "02-000-0000",
        variables: {},
        rcs: { brandId: "BR.other", templateId: "UBR.alt" },
      }),
      { rcsSenderNumber: "1600-0000" },
    );

    expect(call.body).toMatchObject({
      brandId: "BR.other",
      templateCode: "UBR.alt",
      callback: "020000000",
      list: [{ phone: "01012345678" }],
    });
    expect((call.body.list as unknown[])[0]).not.toHaveProperty(
      "templateParam",
    );
    expect(result.providerMessageId).toBe("iwinv-rcs:BR.other:UBR.alt");
  });

  test("uses rcsSenderNumber before senderNumber", async () => {
    const { call } = await sendOk(rcs(), { rcsSenderNumber: "1600-0000" });
    expect(call.body.callback).toBe("16000000");
  });

  test("a scheduled send reserves it in KST and is PENDING", async () => {
    const { call, result } = await sendOk(
      rcs({ options: { scheduledAt: new Date("2026-10-05T01:30:00.000Z") } }),
    );

    expect(call.body).toMatchObject({
      reserve: "Y",
      sendDate: "2026-10-05 10:30:00",
    });
    expect(result.status).toBe("PENDING");
  });

  test.each([
    [
      "no rcsApiKey",
      rcs(),
      { rcsApiKey: undefined, apiKey: "alimtalk" },
      "rcsApiKey",
    ],
    ["no brand", rcs(), { rcsBrandId: undefined }, "brandId"],
    ["no template", rcs({ templateId: " " }), {}, "templateId"],
    [
      "no sender",
      rcs(),
      { senderNumber: undefined },
      "from is required for RCS_TPL",
    ],
    ["no recipient", rcs({ to: "" }), {}, "to is required"],
  ] as const)(
    "refuses a send with %s before calling IWINV",
    async (_label, options, config, text) => {
      const { error, calls } = await sendError(options, accepted, 200, config);

      expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(error.message).toContain(text);
      expect(calls).toHaveLength(0);
    },
  );
});

describe("IWINV RCS fallback", () => {
  test("failover with SMS-sized text sends an SMS fallback", async () => {
    const { call } = await sendOk(
      rcs({
        failover: {
          enabled: true,
          fallbackContent: " [K-OTP] 인증번호 123456 ",
          fallbackTitle: "ignored for SMS",
        },
      }),
    );

    expect(call.body).toMatchObject({
      reSend: "Y",
      resendType: "SMS",
      resendContent: "[K-OTP] 인증번호 123456",
    });
    expect(call.body).not.toHaveProperty("resendTitle");
  });

  test("text over 90 bytes, or fallbackChannel lms, sends an LMS with its title", async () => {
    for (const failover of [
      { fallbackContent: "가".repeat(46), fallbackTitle: "안내" },
      {
        fallbackContent: "short",
        fallbackTitle: "안내",
        fallbackChannel: "lms" as const,
      },
    ]) {
      const { call } = await sendOk(rcs({ failover }));

      expect(call.body).toMatchObject({
        reSend: "Y",
        resendType: "LMS",
        resendTitle: "안내",
      });
    }
  });

  test("providerOptions fields take precedence", async () => {
    const { call } = await sendOk(
      rcs({
        failover: { enabled: true, fallbackContent: "from failover" },
        providerOptions: {
          reSend: "y",
          resendType: "lms",
          resendTitle: "제목",
          resendContent: "from providerOptions",
        },
      }),
    );

    expect(call.body).toMatchObject({
      reSend: "Y",
      resendType: "LMS",
      resendTitle: "제목",
      resendContent: "from providerOptions",
    });
  });

  test("failover.enabled false or rcs.disableSms sends no fallback", async () => {
    for (const options of [
      rcs({ failover: { enabled: false, fallbackContent: "x" } }),
      rcs({ failover: { fallbackContent: "x" }, rcs: { disableSms: true } }),
    ]) {
      const { call } = await sendOk(options);
      expect(call.body.reSend).toBe("N");
      expect(call.body).not.toHaveProperty("resendContent");
    }
  });

  test("failover.enabled without text asks IWINV for its own fallback", async () => {
    const { call } = await sendOk(rcs({ failover: { enabled: true } }));

    expect(call.body.reSend).toBe("Y");
    expect(call.body).not.toHaveProperty("resendType");
    expect(call.body).not.toHaveProperty("resendContent");
  });

  test.each([
    [
      "SMS text over 90 bytes",
      {
        failover: { fallbackContent: "가".repeat(46), fallbackChannel: "sms" },
      },
      "at most 90 bytes",
    ],
    [
      "LMS text over 2000 bytes",
      { failover: { fallbackContent: "가".repeat(1001) } },
      "at most 2000 bytes",
    ],
    [
      "an unknown resendType",
      {
        failover: { fallbackContent: "x" },
        providerOptions: { resendType: "MMS" },
      },
      "resendType must be 'SMS' or 'LMS'",
    ],
    [
      "an unknown reSend",
      { providerOptions: { reSend: "yes" } },
      "reSend must be 'Y' or 'N'",
    ],
  ] as const)(
    "refuses %s before calling IWINV",
    async (_label, overrides, text) => {
      const { error, calls } = await sendError(
        rcs(overrides as Partial<RcsTemplateSendOptions>),
        accepted,
      );

      expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(error.message).toContain(text);
      expect(calls).toHaveLength(0);
    },
  );
});

describe("IWINV RCS send errors", () => {
  test.each([
    [202, KMsgErrorCode.AUTHENTICATION_FAILED, undefined],
    [203, KMsgErrorCode.INVALID_REQUEST, undefined],
    [206, KMsgErrorCode.AUTHENTICATION_FAILED, "IP_NOT_ALLOWED"],
    [207, KMsgErrorCode.TEMPLATE_NOT_FOUND, undefined],
    [209, KMsgErrorCode.INVALID_REQUEST, undefined],
    [212, KMsgErrorCode.INVALID_REQUEST, undefined],
    [213, KMsgErrorCode.INVALID_REQUEST, undefined],
    [215, KMsgErrorCode.INVALID_REQUEST, "RECIPIENT_NUMBER_INVALID"],
    [218, KMsgErrorCode.INVALID_REQUEST, "SENDER_NUMBER_NOT_REGISTERED"],
    [222, KMsgErrorCode.INSUFFICIENT_BALANCE, "AUTO_CHARGE_LIMIT_EXCEEDED"],
    [223, KMsgErrorCode.PROVIDER_ERROR, undefined],
    [224, KMsgErrorCode.INSUFFICIENT_BALANCE, undefined],
    [226, KMsgErrorCode.PROVIDER_ERROR, undefined],
  ] as const)("code %d is %s", async (code, expected, reason) => {
    const { error } = await sendError(
      rcs(),
      JSON.stringify({ code: String(code), message: `IWINV ${code}` }),
    );

    expect(error.code).toBe(expected);
    expect(error.providerErrorCode).toBe(String(code));
    expect(error.providerErrorText).toBe(`IWINV ${code}`);
    expect(error.httpStatus).toBe(200);
    expect(getIWINVSendErrorReason(error)).toBe(reason);
  });

  test('a string "200" is an accepted send', async () => {
    const { fetch } = recordingFetch([
      { body: JSON.stringify({ code: "200", success: "1" }) },
    ]);
    const result = await createProvider().send(rcs(), { fetch });
    expect(result.isSuccess).toBe(true);
  });

  test("a 2xx answer without a code is an unknown outcome", async () => {
    for (const body of ["{}", "OK", JSON.stringify({ code: "x" })]) {
      const { error } = await sendError(rcs(), body);
      expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
      expect(error.providerErrorCode).toBeUndefined();
    }
  });

  test("HTTP 429 and 5xx stay retryable whatever the body says", async () => {
    const limited = await sendError(rcs(), JSON.stringify({ code: 218 }), 429);
    expect(limited.error.code).toBe(KMsgErrorCode.RATE_LIMIT_EXCEEDED);

    const down = await sendError(rcs(), "<html>Bad Gateway</html>", 502);
    expect(down.error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(down.error.providerErrorCode).toBeUndefined();
  });

  test("a non-2xx answer without a code maps by status", async () => {
    const { error } = await sendError(rcs(), "Forbidden", 403);
    expect(error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
  });

  test("a 200 that took no recipient is not reported as sent", async () => {
    const { error } = await sendError(
      rcs(),
      JSON.stringify({
        code: 200,
        message: "메시지가 발송되었습니다",
        success: 0,
        fail: 1,
      }),
    );

    expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(error.details).toMatchObject({ success: 0, fail: 1 });
  });
});

describe("IWINV RCS delivery status", () => {
  const requestedAt = new Date("2026-10-05T01:00:00.000Z"); // 10:00:00 KST

  const row = (overrides: Record<string, string>) => ({
    brand_name: "K-OTP",
    template_code: "UBR.otp01",
    send_method: "API",
    callback: "15880000",
    phone: "01012345678",
    req_date: "2026-10-05 10:00:01",
    done_code: "10000",
    done_message: "성공",
    msgkey: "RCS-1",
    state: "발송완료",
    template_name: "OTP",
    ...overrides,
  });

  const history = (list: unknown[]) =>
    JSON.stringify({
      code: 200,
      totalCount: list.length,
      message: "데이터가 조회되었습니다.",
      list,
    });

  async function lookup(
    body: string,
    providerMessageId = CORRELATION_ID,
    status = 200,
  ) {
    const { fetch, calls } = recordingFetch([{ body, status }]);
    const result = await createProvider().getDeliveryStatus(
      {
        providerMessageId,
        type: "RCS_TPL",
        to: "01012345678",
        requestedAt,
      },
      { fetch },
    );
    return { result, call: calls[0] as Captured };
  }

  test("finds the send by brand, template, recipient and request time", async () => {
    const { result, call } = await lookup(
      history([
        row({ msgkey: "RCS-earlier", req_date: "2026-10-05 09:50:00" }),
        row({ msgkey: "RCS-later", req_date: "2026-10-05 10:03:00" }),
        row({ msgkey: "RCS-ours", req_date: "2026-10-05 10:00:02" }),
        row({
          msgkey: "RCS-console",
          send_method: "WEB",
          req_date: "2026-10-05 10:00:00",
        }),
        row({
          msgkey: "RCS-other",
          template_code: "UBR.other",
          req_date: "2026-10-05 10:00:00",
        }),
      ]),
    );

    expect(call.url).toBe(HISTORY_URL);
    expect(call.headers.auth).toBe(btoa(RCS_KEY));
    expect(call.body).toMatchObject({
      pageNum: 1,
      phone: "01012345678",
      brandId: "BR.brand01",
      templateCode: "UBR.otp01",
      startDate: "2026-10-05 09:59:00",
    });
    expect(call.body).not.toHaveProperty("msgkey");

    if (result.isFailure) throw result.error;
    expect(result.value).toMatchObject({
      providerId: "iwinv",
      providerMessageId: CORRELATION_ID,
      status: "DELIVERED",
      statusCode: "10000",
      statusMessage: "성공",
      sentAt: new Date("2026-10-05T01:00:02.000Z"),
    });
    expect(result.value?.raw).toMatchObject({ msgkey: "RCS-ours" });
  });

  test("an IWINV msgkey is looked up as is", async () => {
    const { result, call } = await lookup(
      history([
        row({
          msgkey: "RCS-1",
          state: "수신실패",
          done_code: "54001",
          done_message: "단말 미지원",
        }),
      ]),
      "RCS-1",
    );

    expect(call.body).toMatchObject({ msgkey: "RCS-1", phone: "01012345678" });
    expect(call.body).not.toHaveProperty("templateCode");
    if (result.isFailure) throw result.error;
    expect(result.value).toMatchObject({
      status: "FAILED",
      statusCode: "54001",
      statusMessage: "단말 미지원",
    });
  });

  test("no matching row is not found yet", async () => {
    const { result } = await lookup(
      history([row({ req_date: "2026-10-05 09:30:00" })]),
    );
    expect(result.isSuccess && result.value).toBeNull();
  });

  test("a history refusal is an error with IWINV's code", async () => {
    const { result } = await lookup(
      JSON.stringify({
        code: 206,
        message: "등록된 IP에서만 발송이 가능합니다.",
      }),
    );

    if (result.isSuccess) throw new Error("expected the lookup to fail");
    expect(result.error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
    expect(result.error.providerErrorCode).toBe("206");
  });

  test.each([
    ["수신완료", "", "", "DELIVERED"],
    ["수신실패", "", "", "FAILED"],
    ["대기", "", "", "PENDING"],
    ["발송완료", "10000", "성공", "DELIVERED"],
    ["발송완료", "54001", "실패", "FAILED"],
    ["발송완료", "", "", "SENT"],
    ["", "", "", "PENDING"],
  ] as const)(
    "state %p with done_code %p maps to %s",
    (state, doneCode, doneMessage, expected) => {
      expect(
        mapIwinvRcsHistoryStatus(
          state || undefined,
          doneCode || undefined,
          doneMessage || undefined,
        ),
      ).toBe(expected);
    },
  );
});
