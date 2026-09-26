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

describe("AligoProvider (Kakao APIs)", () => {
  test("listKakaoChannelCategories calls /akv10/category/ and maps entries", async () => {
    let calledUrl = "";
    let calledBody: Record<string, string> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledBody = await formDataToObject(init?.body);
      return new Response(
        JSON.stringify({
          code: 0,
          message: "ok",
          data: {
            firstBusinessType: [{ parentCode: "", code: "001", name: "건강" }],
            secondBusinessType: [],
            thirdBusinessType: [],
          },
        }),
        { status: 200 },
      );
    };

    const provider = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
    });

    const result = await provider.listKakaoChannelCategories();
    expect(calledUrl).toBe("https://kakaoapi.aligo.in/akv10/category/");
    expect(calledBody.apikey).toBe("api-key");
    expect(calledBody.userid).toBe("user");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.first[0]?.code).toBe("001");
    }
  });

  test("createTemplate fails when senderKey is missing", async () => {
    const provider = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
    });

    const result = await provider.createTemplate({
      name: "n",
      content: "c",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
    }
  });

  test("createTemplate validates buttons before provider request", async () => {
    const provider = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
      senderKey: "SENDERKEY",
    });

    const result = await provider.createTemplate({
      name: "name",
      content: "content",
      buttons: [
        {
          type: "WL",
          name: "",
          linkMobile: "https://example.com",
        },
      ],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
      expect(result.error.message).toBe("buttons[0].name is required");
    }
  });

  test("createTemplate calls /akv10/template/add/ and returns templtCode", async () => {
    let calledUrl = "";
    let calledBody: Record<string, string> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledBody = await formDataToObject(init?.body);
      return new Response(
        JSON.stringify({
          code: 0,
          message: "ok",
          data: {
            senderKey: "SENDERKEY",
            templtContent: "content",
            templtName: "name",
            cdate: "2018-12-28 17:21:40",
            comments: [],
            buttons: [],
            templtCode: "P000004",
            udate: "",
            inspStatus: "REG",
            status: "R",
          },
        }),
        { status: 200 },
      );
    };

    const provider = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
      senderKey: "SENDERKEY",
    });

    const result = await provider.createTemplate({
      name: "name",
      content: "content",
    });

    expect(calledUrl).toBe("https://kakaoapi.aligo.in/akv10/template/add/");
    expect(calledBody.senderkey).toBe("SENDERKEY");
    expect(calledBody.tpl_name).toBe("name");
    expect(calledBody.tpl_content).toBe("content");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.code).toBe("P000004");
      expect(result.value.status).toBe("INSPECTION");
    }
  });

  test("requestTemplateInspection calls /akv10/template/request/", async () => {
    let calledUrl = "";
    let calledBody: Record<string, string> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledBody = await formDataToObject(init?.body);
      return new Response(JSON.stringify({ code: 0, message: "ok" }), {
        status: 200,
      });
    };

    const provider = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
      senderKey: "SENDERKEY",
    });

    const result = await provider.requestTemplateInspection("P000004");
    expect(calledUrl).toBe("https://kakaoapi.aligo.in/akv10/template/request/");
    expect(calledBody.senderkey).toBe("SENDERKEY");
    expect(calledBody.tpl_code).toBe("P000004");
    expect(result.isSuccess).toBe(true);
  });
});

describe("AligoProvider (send)", () => {
  test("maps ALIMTALK failover fields and returns partial warning", async () => {
    let calledUrl = "";
    let calledBody: Record<string, string> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledBody = await formDataToObject(init?.body);
      return new Response(
        JSON.stringify({
          code: 0,
          message: "성공적으로 전송요청 하였습니다.",
          info: { type: "AT", mid: 123456789, scnt: 1, fcnt: 0 },
        }),
        { status: 200 },
      );
    };

    const provider = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
      senderKey: "SENDERKEY",
      sender: "01000000000",
    });

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { name: "Jane" },
      failover: {
        enabled: true,
        fallbackChannel: "lms",
        fallbackTitle: "fallback title",
        fallbackContent: "fallback body",
      },
    });

    expect(calledUrl).toBe("https://kakaoapi.aligo.in/akv10/alimtalk/send/");
    expect(calledBody.failover).toBe("Y");
    expect(calledBody.fsubject_1).toBe("fallback title");
    expect(calledBody.fmessage_1).toBe("fallback body");
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.providerMessageId).toBe("123456789");
      expect(result.value.warnings?.[0]?.code).toBe(
        "FAILOVER_PARTIAL_PROVIDER",
      );
    }
  });
});

// Response shapes follow the Aligo API documentation: the Kakao endpoints
// answer `{ code, message, info: { mid } }` and the SMS endpoint answers
// `{ result_code, message, msg_id }` with numeric codes.
describe("AligoProvider (send responses)", () => {
  function createSendProvider() {
    return new AligoProvider({
      apiKey: "api-key",
      userId: "user",
      senderKey: "SENDERKEY",
      sender: "01000000000",
    });
  }

  function respondWith(body: Record<string, unknown>) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify(body), { status: 200 });
  }

  test("rejects an ALIMTALK send the Kakao API refused", async () => {
    respondWith({ code: -99, message: "포인트가 부족합니다." });

    const result = await createSendProvider().send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { name: "Jane" },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe("포인트가 부족합니다.");
      expect(result.error.code).toBe("INSUFFICIENT_BALANCE");
    }
  });

  test.each([
    ["인증오류입니다.", "AUTHENTICATION_FAILED"],
    [
      "발신 프로파일 키(=senderkey) 파라메더 정보가 전달되지 않았습니다.",
      "INVALID_REQUEST",
    ],
  ])("classifies Kakao code -99 by its message %p", async (message, code) => {
    respondWith({ code: -99, message });

    const result = await createSendProvider().send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { name: "Jane" },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(String(result.error.code)).toBe(code);
    }
  });

  test("accepts a FRIENDTALK send with code 0 and reads info.mid", async () => {
    respondWith({
      code: 0,
      message: "성공적으로 전송요청 하였습니다.",
      info: { type: "FT", mid: 987654321, scnt: 1, fcnt: 0 },
    });

    const result = await createSendProvider().send({
      type: "FRIENDTALK",
      to: "01012345678",
      text: "friend message",
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.providerMessageId).toBe("987654321");
    }
  });

  test("accepts an SMS send with a numeric result_code", async () => {
    respondWith({
      result_code: 1,
      message: "",
      msg_id: 123456789,
      success_cnt: 1,
      error_cnt: 0,
      msg_type: "SMS",
    });

    const result = await createSendProvider().send({
      type: "SMS",
      to: "01012345678",
      text: "hello",
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.providerMessageId).toBe("123456789");
    }
  });

  test.each([
    [true],
    [["1"]],
    ["0x1"],
    [null],
  ])("rejects an SMS response with malformed result_code %p", async (resultCode) => {
    respondWith({ result_code: resultCode, message: "", msg_id: 1 });

    const result = await createSendProvider().send({
      type: "SMS",
      to: "01012345678",
      text: "hello",
    });

    expect(result.isFailure).toBe(true);
  });

  test("rejects a Kakao send response that is not an object", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify([{ code: 0 }]), { status: 200 });

    const result = await createSendProvider().send({
      type: "ALIMTALK",
      to: "01012345678",
      templateId: "TPL_1",
      variables: { name: "Jane" },
    });

    expect(result.isFailure).toBe(true);
  });

  test("maps a negative SMS result_code to its error", async () => {
    respondWith({ result_code: -101, message: "인증오류입니다." });

    const result = await createSendProvider().send({
      type: "SMS",
      to: "01012345678",
      text: "hello",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("AUTHENTICATION_FAILED");
    }
  });
});
