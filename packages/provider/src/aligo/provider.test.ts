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
          result_code: "0",
          msg_id: "ALIGO_MSG_1",
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
      expect(result.value.warnings?.[0]?.code).toBe(
        "FAILOVER_PARTIAL_PROVIDER",
      );
    }
  });
});
