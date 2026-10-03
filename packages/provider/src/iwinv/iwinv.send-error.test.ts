import { describe, expect, test } from "bun:test";
import {
  KMsgError,
  KMsgErrorCode,
  normalizeProviderError,
  type ProviderFetch,
  type SendOptions,
} from "@k-msg/core";
import {
  getIWINVSendErrorReason,
  IWINV_PROVIDER_TEXT_MAX_LENGTH,
} from "./iwinv.send-error";
import { IWINVSendProvider } from "./provider.send";
import {
  IWINV_SEND_ERROR_REASONS,
  type IWINVSendErrorReason,
} from "./types/iwinv";

const SENDER_MISMATCH_TEXT = "조직(업체) 발신번호가 일치하지 않습니다.";

const createProvider = () =>
  new IWINVSendProvider({
    apiKey: "alimtalk-api-key",
    smsApiKey: "sms-api-key",
    smsAuthKey: "sms-auth-key",
  });

const sms: SendOptions = {
  type: "SMS",
  to: "01012345678",
  from: "01000000000",
  text: "인증번호 123456",
};

const alimTalk: SendOptions = {
  type: "ALIMTALK",
  to: "01012345678",
  from: "01000000000",
  templateId: "TPL_1",
  variables: { code: "123456" },
  providerOptions: { templateContent: "#{code}" },
};

const respondWith =
  (body: string, status = 200): ProviderFetch =>
  async () =>
    new Response(body, { status });

async function sendFailure(
  options: SendOptions,
  fetch: ProviderFetch,
): Promise<KMsgError> {
  const result = await createProvider().send(options, { fetch });
  if (result.isSuccess) throw new Error("expected the send to fail");
  return result.error;
}

describe("IWINV send errors carry IWINV's code and text", () => {
  test("SMS v2: keeps resultCode and message of a sender-number refusal", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({ resultCode: 13, message: SENDER_MISMATCH_TEXT }),
      ),
    );

    expect(error).toBeInstanceOf(KMsgError);
    expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    expect(error.message).toBe(SENDER_MISMATCH_TEXT);
    expect(error.providerErrorCode).toBe("13");
    expect(error.providerErrorText).toBe(SENDER_MISMATCH_TEXT);
    expect(error.httpStatus).toBe(200);
    expect(error.details).toMatchObject({
      providerId: "iwinv",
      originalCode: 13,
      reason: "SENDER_NUMBER_NOT_REGISTERED",
    });
  });

  test("SMS v2: a string resultCode is reported as is", async () => {
    const error = await sendFailure(
      { ...sms, type: "LMS", subject: "제목" } as SendOptions,
      respondWith(
        JSON.stringify({ resultCode: "15", message: "등록하지 않은 IP" }),
      ),
    );

    expect(error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
    expect(error.providerErrorCode).toBe("15");
    expect(error.providerErrorText).toBe("등록하지 않은 IP");
  });

  test("SMS v2: a bare code gets IWINV's documented text", async () => {
    const error = await sendFailure(sms, respondWith("202"));

    expect(error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
    expect(error.providerErrorCode).toBe("202");
    expect(error.providerErrorText).toBe(
      "SMS API 인증 실패 또는 SMS 서비스 권한이 없습니다.",
    );
    expect(error.message).toBe(error.providerErrorText as string);
  });

  test("SMS v2: an HTML error page is neither code nor text", async () => {
    const error = await sendFailure(
      sms,
      respondWith("<html><body>Bad Gateway</body></html>", 502),
    );

    expect(error.code).toBe(KMsgErrorCode.NETWORK_ERROR);
    expect(error.providerErrorCode).toBeUndefined();
    expect(error.providerErrorText).toBeUndefined();
    expect(error.httpStatus).toBe(502);
    expect(error.message).toBe("SMS send failed");
  });

  test("MMS: keeps resultCode and message", async () => {
    const error = await sendFailure(
      {
        ...sms,
        type: "MMS",
        media: {
          image: {
            bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
            filename: "a.jpg",
            contentType: "image/jpeg",
          },
        },
      } as SendOptions,
      respondWith(
        JSON.stringify({ resultCode: 13, message: SENDER_MISMATCH_TEXT }),
      ),
    );

    expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    expect(error.providerErrorCode).toBe("13");
    expect(error.providerErrorText).toBe(SENDER_MISMATCH_TEXT);
  });

  test("AlimTalk: keeps code and message", async () => {
    const text =
      "발신번호는 발신번호 관리에서 사전에 등록된 발신번호로만 발송이 가능합니다.";
    const error = await sendFailure(
      alimTalk,
      respondWith(JSON.stringify({ code: 505, message: text })),
    );

    expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    expect(error.providerErrorCode).toBe("505");
    expect(error.providerErrorText).toBe(text);
    expect(error.httpStatus).toBe(200);
    expect(error.details).toMatchObject({
      originalCode: 505,
      reason: "SENDER_NUMBER_NOT_REGISTERED",
    });
  });

  test("AlimTalk: a bare-code body is IWINV's code, without text", async () => {
    const error = await sendFailure(alimTalk, respondWith("501"));

    expect(error.code).toBe(KMsgErrorCode.TEMPLATE_NOT_FOUND);
    expect(error.providerErrorCode).toBe("501");
    expect(error.providerErrorText).toBeUndefined();
  });

  test("AlimTalk: an HTML error page is not reported as IWINV's code", async () => {
    const error = await sendFailure(
      alimTalk,
      respondWith("<html>Service Unavailable</html>", 503),
    );

    expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(error.providerErrorCode).toBeUndefined();
    expect(error.providerErrorText).toBeUndefined();
    expect(error.httpStatus).toBe(503);
  });

  test("SMS v2: a plain-text body sets no code", async () => {
    const error = await sendFailure(sms, respondWith("Forbidden", 403));

    expect(error.providerErrorCode).toBeUndefined();
    expect(error.providerErrorText).toBeUndefined();
    expect(error.details?.originalCode).toBeUndefined();
    expect(error.httpStatus).toBe(403);
    expect(error.message).toBe("SMS send failed");
  });

  test("a long message with control characters is bounded", async () => {
    const message = `\u0000앞\r\n\t뒤${"가".repeat(2_000)}\u0007`;
    for (const [options, body] of [
      [sms, JSON.stringify({ resultCode: 1, message })],
      [alimTalk, JSON.stringify({ code: 518, message })],
    ] as const) {
      const error = await sendFailure(options, respondWith(body));
      const text = error.providerErrorText as string;

      expect(Array.from(text)).toHaveLength(IWINV_PROVIDER_TEXT_MAX_LENGTH);
      expect(text.startsWith("앞 뒤가")).toBe(true);
      expect(text.endsWith("…")).toBe(true);
      expect(/\p{Cc}/u.test(text)).toBe(false);
      expect(error.message).toBe(text);
    }
  });

  test("an AlimTalk non-JSON body is bounded in the message", async () => {
    const error = await sendFailure(
      alimTalk,
      respondWith(`<html>${"x".repeat(5_000)}</html>`, 503),
    );

    expect(Array.from(error.message).length).toBeLessThanOrEqual(
      IWINV_PROVIDER_TEXT_MAX_LENGTH,
    );
    expect(error.providerErrorText).toBeUndefined();
  });

  test("phone-like runs in IWINV's text are masked", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({
          resultCode: 1,
          message:
            "수신 010-1234-5678, 01012345678, +821012345678 차단 (2000 Bytes, 2015-09-02)",
        }),
      ),
    );

    expect(error.providerErrorText).toBe(
      "수신 ***, ***, *** 차단 (2000 Bytes, 2015-09-02)",
    );
    expect(error.message).toBe(error.providerErrorText as string);
  });

  test("spaced and parenthesized phone numbers are masked", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({
          resultCode: 1,
          message:
            "수신 010 1234 5678, (010) 1234-5678, +82 10-1234-5678, (02)1234-5678 차단 (2000 Bytes, 2015-09-02, 1000 2000)",
        }),
      ),
    );

    expect(error.providerErrorText).toBe(
      "수신 ***, ***, ***, *** 차단 (2000 Bytes, 2015-09-02, 1000 2000)",
    );
  });

  test("normalizeProviderError keeps the provider code and text", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({ resultCode: 13, message: SENDER_MISMATCH_TEXT }),
      ),
    );

    for (const mode of ["safe", "compat"] as const) {
      const normalized = normalizeProviderError(error, { mode });
      expect(normalized.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(normalized.classification).toBe("non_retryable");
      expect(normalized.providerErrorCode).toBe("13");
      expect(normalized.providerErrorText).toBe(SENDER_MISMATCH_TEXT);
      expect(normalized.httpStatus).toBe(200);
    }
  });
});

describe("IWINV send errors name the refusal in details.reason", () => {
  test("a sender-number text under an unlisted code is a non-retryable refusal", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({ resultCode: 99, message: SENDER_MISMATCH_TEXT }),
      ),
    );

    // Without the text, an unlisted code on an OK response is PROVIDER_ERROR,
    // which the default retry policy retries.
    expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    expect(error.details?.reason).toBe("SENDER_NUMBER_NOT_REGISTERED");
    expect(error.providerErrorCode).toBe("99");
    expect(normalizeProviderError(error).classification).toBe("non_retryable");
  });

  test("a sender-number text on a non-OK response is not a network error", async () => {
    const error = await sendFailure(
      sms,
      respondWith(JSON.stringify({ message: SENDER_MISMATCH_TEXT }), 400),
    );

    expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    expect(error.details?.reason).toBe("SENDER_NUMBER_NOT_REGISTERED");
    expect(error.providerErrorCode).toBeUndefined();
    expect(error.httpStatus).toBe(400);
  });

  test.each([
    ["15", KMsgErrorCode.AUTHENTICATION_FAILED, "IP_NOT_ALLOWED"],
    ["206", KMsgErrorCode.AUTHENTICATION_FAILED, "IP_NOT_ALLOWED"],
    ["41", KMsgErrorCode.INVALID_REQUEST, "RECIPIENT_NUMBER_INVALID"],
    ["50", KMsgErrorCode.INSUFFICIENT_BALANCE, "AUTO_CHARGE_LIMIT_EXCEEDED"],
  ])(
    "SMS resultCode %s is %s with reason %s",
    async (resultCode, code, reason) => {
      const error = await sendFailure(sms, respondWith(resultCode));

      expect(error.code).toBe(code);
      expect(error.details?.reason).toBe(reason);
    },
  );

  test("AlimTalk code 206 alone is an IP refusal", async () => {
    const error = await sendFailure(
      alimTalk,
      respondWith(JSON.stringify({ code: 206 })),
    );

    expect(error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
    expect(getIWINVSendErrorReason(error)).toBe("IP_NOT_ALLOWED");
  });

  test("AlimTalk codes without a verified reason set none", async () => {
    for (const code of [512, 513]) {
      const error = await sendFailure(
        alimTalk,
        respondWith(JSON.stringify({ code, message: "x" })),
      );

      expect(error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(getIWINVSendErrorReason(error)).toBeUndefined();
    }
  });

  test("an IP text under an unlisted SMS code is an authentication refusal", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({
          resultCode: 99,
          message: "등록하지 않은 IP에서는 발송되지 않습니다.",
        }),
      ),
    );

    expect(error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
    expect(getIWINVSendErrorReason(error)).toBe("IP_NOT_ALLOWED");
  });

  test("a sender-number text keeps a rate limit retryable", async () => {
    const cases: Array<[SendOptions, string, number]> = [
      [
        alimTalk,
        JSON.stringify({ code: 429, message: SENDER_MISMATCH_TEXT }),
        200,
      ],
      [alimTalk, JSON.stringify({ message: SENDER_MISMATCH_TEXT }), 429],
      [sms, JSON.stringify({ message: SENDER_MISMATCH_TEXT }), 429],
      [
        sms,
        JSON.stringify({ resultCode: 429, message: SENDER_MISMATCH_TEXT }),
        200,
      ],
    ];
    for (const [options, body, status] of cases) {
      const error = await sendFailure(options, respondWith(body, status));

      expect(error.code).not.toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(normalizeProviderError(error).classification).toBe("retryable");
      expect(getIWINVSendErrorReason(error)).toBe(
        "SENDER_NUMBER_NOT_REGISTERED",
      );
    }
    // A 429 status or AlimTalk code is a rate limit.
    for (const [options, body, status] of cases.slice(0, 3)) {
      const error = await sendFailure(options, respondWith(body, status));
      expect(error.code).toBe(KMsgErrorCode.RATE_LIMIT_EXCEEDED);
    }
  });

  test("a sender-number text keeps an SMS 5xx failure's code", async () => {
    const httpFailure = await sendFailure(
      sms,
      respondWith(JSON.stringify({ message: SENDER_MISMATCH_TEXT }), 502),
    );
    expect(httpFailure.code).toBe(KMsgErrorCode.NETWORK_ERROR);
    expect(httpFailure.httpStatus).toBe(502);

    const codeFailure = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({ resultCode: 502, message: SENDER_MISMATCH_TEXT }),
      ),
    );
    expect(codeFailure.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(codeFailure.providerErrorCode).toBe("502");
  });

  test("a sender-number text keeps an AlimTalk 5xx code's classification", async () => {
    const error = await sendFailure(
      alimTalk,
      respondWith(JSON.stringify({ code: 599, message: SENDER_MISMATCH_TEXT })),
    );

    expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(getIWINVSendErrorReason(error)).toBe("SENDER_NUMBER_NOT_REGISTERED");
  });

  test("HTTP 429 is a rate limit whatever listed code the body holds", async () => {
    const mms = {
      ...sms,
      type: "MMS",
      media: {
        image: {
          bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
          filename: "a.jpg",
          contentType: "image/jpeg",
        },
      },
    } as SendOptions;
    const lms = { ...sms, type: "LMS", subject: "제목" } as SendOptions;
    const cases: Array<[SendOptions, string, IWINVSendErrorReason]> = [
      [sms, JSON.stringify({ resultCode: 13 }), "SENDER_NUMBER_NOT_REGISTERED"],
      [lms, JSON.stringify({ resultCode: "15" }), "IP_NOT_ALLOWED"],
      [mms, JSON.stringify({ resultCode: 50 }), "AUTO_CHARGE_LIMIT_EXCEEDED"],
      [sms, "13", "SENDER_NUMBER_NOT_REGISTERED"],
      [alimTalk, JSON.stringify({ code: 505 }), "SENDER_NUMBER_NOT_REGISTERED"],
      [alimTalk, JSON.stringify({ code: 206 }), "IP_NOT_ALLOWED"],
    ];
    for (const [options, body, reason] of cases) {
      const error = await sendFailure(options, respondWith(body, 429));

      expect(error.code).toBe(KMsgErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.httpStatus).toBe(429);
      expect(normalizeProviderError(error).classification).toBe("retryable");
      expect(getIWINVSendErrorReason(error)).toBe(reason);
    }
  });

  test("HTTP 5xx is retryable whatever listed code the body holds", async () => {
    const smsError = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({ resultCode: 13, message: SENDER_MISMATCH_TEXT }),
        503,
      ),
    );
    expect(smsError.code).toBe(KMsgErrorCode.NETWORK_ERROR);
    expect(smsError.providerErrorCode).toBe("13");
    expect(normalizeProviderError(smsError).classification).toBe("retryable");
    expect(getIWINVSendErrorReason(smsError)).toBe(
      "SENDER_NUMBER_NOT_REGISTERED",
    );

    const alimTalkError = await sendFailure(
      alimTalk,
      respondWith(JSON.stringify({ code: 505, message: "x" }), 502),
    );
    expect(alimTalkError.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(alimTalkError.providerErrorCode).toBe("505");
    expect(normalizeProviderError(alimTalkError).classification).toBe(
      "retryable",
    );
    expect(getIWINVSendErrorReason(alimTalkError)).toBe(
      "SENDER_NUMBER_NOT_REGISTERED",
    );
  });

  test("an AlimTalk 5xx without a body code stays retryable", async () => {
    for (const status of [501, 502, 505, 517]) {
      const error = await sendFailure(
        alimTalk,
        respondWith(JSON.stringify({ message: "maintenance" }), status),
      );
      expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
      expect(error.providerErrorCode).toBeUndefined();
      expect(normalizeProviderError(error).classification).toBe("retryable");
    }
  });

  test("other refusals set no reason and keep their code", async () => {
    const error = await sendFailure(
      sms,
      respondWith(
        JSON.stringify({
          resultCode: 1,
          message: "메시지가 전송되지 않았습니다.",
        }),
      ),
    );

    expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
    expect(error.details).not.toHaveProperty("reason");
  });
});

describe("IWINV sends answered 2xx without a numeric code", () => {
  const unknownOutcomeBodies = [
    ["an empty object", "{}"],
    ["a non-numeric code", JSON.stringify({ code: "x" })],
    ["a non-numeric resultCode", JSON.stringify({ resultCode: "x" })],
    ["an empty body", ""],
    ["plain text", "OK"],
  ] as const;

  for (const [label, body] of unknownOutcomeBodies) {
    test(`AlimTalk: ${label} is a PROVIDER_ERROR, not a refusal or a success`, async () => {
      const error = await sendFailure(alimTalk, respondWith(body));

      expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
      expect(error.providerErrorCode).toBeUndefined();
      expect(error.httpStatus).toBe(200);
      expect(error.details?.reason).toBeUndefined();
    });

    test(`SMS v2: ${label} is a PROVIDER_ERROR`, async () => {
      const error = await sendFailure(sms, respondWith(body));

      expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
      expect(error.providerErrorCode).toBeUndefined();
      expect(error.httpStatus).toBe(200);
      expect(error.details?.reason).toBeUndefined();
    });
  }

  test("AlimTalk: a numeric refusal code on HTTP 200 keeps its classification", async () => {
    for (const [body, code] of [
      [
        JSON.stringify({ code: 501, message: "템플릿 없음" }),
        "TEMPLATE_NOT_FOUND",
      ],
      [JSON.stringify({ code: "508" }), "INVALID_REQUEST"],
      ["501", "TEMPLATE_NOT_FOUND"],
      [JSON.stringify({ code: 519 }), "INSUFFICIENT_BALANCE"],
    ] as const) {
      const error = await sendFailure(alimTalk, respondWith(body));
      expect(error.code).toBe(KMsgErrorCode[code]);
    }
  });

  test("SMS v2: a numeric refusal code on HTTP 200 keeps its classification", async () => {
    for (const [body, code] of [
      [JSON.stringify({ resultCode: 13 }), "INVALID_REQUEST"],
      [JSON.stringify({ resultCode: "41" }), "INVALID_REQUEST"],
      ["202", "AUTHENTICATION_FAILED"],
      [JSON.stringify({ resultCode: 50 }), "INSUFFICIENT_BALANCE"],
    ] as const) {
      const error = await sendFailure(sms, respondWith(body));
      expect(error.code).toBe(KMsgErrorCode[code]);
    }
  });

  test("a refusal named only by IWINV's text keeps the code it implies", async () => {
    for (const options of [alimTalk, sms]) {
      for (const [message, code, reason] of [
        [
          SENDER_MISMATCH_TEXT,
          KMsgErrorCode.INVALID_REQUEST,
          "SENDER_NUMBER_NOT_REGISTERED",
        ],
        [
          "등록하지 않은 IP에서는 발송되지 않습니다.",
          KMsgErrorCode.AUTHENTICATION_FAILED,
          "IP_NOT_ALLOWED",
        ],
      ] as const) {
        const error = await sendFailure(
          options,
          respondWith(JSON.stringify({ message })),
        );

        // IWINV said it refused the send, so the outcome is not unknown.
        expect(error.code).toBe(code);
        expect(error.details?.reason).toBe(reason);
        expect(error.providerErrorCode).toBeUndefined();
        expect(error.httpStatus).toBe(200);
      }
    }
  });

  test("a text that names no refusal leaves the outcome unknown", async () => {
    for (const options of [alimTalk, sms]) {
      const error = await sendFailure(
        options,
        respondWith(JSON.stringify({ message: "처리 중 오류" })),
      );

      expect(error.code).toBe(KMsgErrorCode.PROVIDER_ERROR);
      expect(error.details?.reason).toBeUndefined();
    }
  });

  test("AlimTalk: a non-2xx answer without a code still maps by HTTP status", async () => {
    const error = await sendFailure(alimTalk, respondWith("Forbidden", 403));

    expect(error.code).toBe(KMsgErrorCode.AUTHENTICATION_FAILED);
    expect(error.details?.originalCode).toBe(403);
  });
});

describe("getIWINVSendErrorReason", () => {
  test("reads a known reason from details", () => {
    for (const reason of IWINV_SEND_ERROR_REASONS) {
      const error = new KMsgError(KMsgErrorCode.INVALID_REQUEST, "x", {
        reason,
      });
      expect(getIWINVSendErrorReason(error)).toBe(reason);
    }
  });

  test("returns undefined for no reason, an unknown one, or a non-error", () => {
    expect(
      getIWINVSendErrorReason(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "x", { reason: "OTHER" }),
      ),
    ).toBeUndefined();
    expect(
      getIWINVSendErrorReason(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "x"),
      ),
    ).toBeUndefined();
    expect(getIWINVSendErrorReason(undefined)).toBeUndefined();
    expect(
      getIWINVSendErrorReason("SENDER_NUMBER_NOT_REGISTERED"),
    ).toBeUndefined();
  });

  test("is exported from the root and both IWINV entry points", async () => {
    const root = await import("../index");
    const iwinv = await import("./index");
    const send = await import("./send");

    for (const entry of [root, iwinv, send]) {
      expect(entry.getIWINVSendErrorReason).toBe(getIWINVSendErrorReason);
      expect(entry.IWINV_SEND_ERROR_REASONS).toBe(IWINV_SEND_ERROR_REASONS);
    }
  });
});
