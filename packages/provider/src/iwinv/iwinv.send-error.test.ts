import { describe, expect, test } from "bun:test";
import {
  KMsgError,
  KMsgErrorCode,
  normalizeProviderError,
  type ProviderFetch,
  type SendOptions,
} from "@k-msg/core";
import { IWINVSendProvider } from "./provider.send";

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
    expect(error.details).toMatchObject({ originalCode: 505 });
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

    expect(error.providerErrorCode).toBeUndefined();
    expect(error.providerErrorText).toBeUndefined();
    expect(error.httpStatus).toBe(503);
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
