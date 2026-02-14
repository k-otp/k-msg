import { afterEach, describe, expect, test } from "bun:test";
import { IWINVProvider } from "./provider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("IWINVProvider", () => {
  test("SMS uses v2 endpoint with Secret header and v2 payload", async () => {
    let calledUrl = "";
    let calledSecret = "";
    let calledBody: Record<string, unknown> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledSecret = new Headers(init?.headers).get("secret") || "";
      calledBody = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;
      return new Response(
        JSON.stringify({
          resultCode: 14,
          message: "인증 요청이 올바르지 않습니다.",
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      from: "01000000000",
      text: "테스트",
    });

    expect(calledUrl).toBe("https://sms.bizservice.iwinv.kr/api/v2/send/");
    expect(calledSecret).toBe(
      Buffer.from("sms-api-key&sms-auth-key").toString("base64"),
    );
    expect(calledBody.version).toBe("1.0");
    expect(calledBody.from).toBe("01000000000");
    expect(calledBody.to).toEqual(["01012345678"]);
    expect(calledBody.text).toBe("테스트");
    expect(calledBody.msgType).toBe("SMS");
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("AUTHENTICATION_FAILED");
    }
  });

  test("maps numeric SMS response code 202 to clear auth message", async () => {
    globalThis.fetch = async () => new Response("202", { status: 200 });

    const provider = new IWINVProvider({
      apiKey: "test-api-key",
      smsAuthKey: "legacy-auth-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      from: "01000000000",
      text: "테스트",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("AUTHENTICATION_FAILED");
      expect(result.error.message).toContain("SMS API 인증 실패");
    }
  });

  test("ALIMTALK uses AUTH header and v2 payload", async () => {
    let calledUrl = "";
    let calledAuth = "";
    let calledBody: Record<string, unknown> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledAuth = new Headers(init?.headers).get("AUTH") || "";
      calledBody = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;

      return new Response(
        JSON.stringify({ code: 200, message: "ok", seqNo: 123 }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      from: "01000000000",
      templateCode: "TPL_1",
      variables: { code: 1234 },
    });

    expect(calledUrl).toBe("https://alimtalk.bizservice.iwinv.kr/api/v2/send/");
    expect(calledAuth).toBe(Buffer.from("api-key", "utf8").toString("base64"));
    expect(calledBody.templateCode).toBe("TPL_1");
    expect(calledBody.reserve).toBe("N");
    expect(Array.isArray(calledBody.list)).toBe(true);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe("SENT");
      expect(result.value.providerMessageId).toBe("123");
    }
  });

  test("ALIMTALK maps numeric-only response code 501 to TEMPLATE_NOT_FOUND", async () => {
    globalThis.fetch = async () => new Response("501", { status: 200 });

    const provider = new IWINVProvider({
      apiKey: "api-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      from: "01000000000",
      templateCode: "TPL_1",
      variables: { code: 1234 },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("TEMPLATE_NOT_FOUND");
    }
  });

  test("ALIMTALK uses providerOptions.templateParam when provided", async () => {
    let calledBody: Record<string, unknown> = {};

    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      calledBody = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;

      return new Response(
        JSON.stringify({ code: 200, message: "ok", seqNo: 1 }),
        {
          status: 200,
        },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      from: "01000000000",
      templateCode: "TPL_1",
      variables: { code: 1234 },
      providerOptions: { templateParam: ["A", "B", "C"] },
    });

    const list = (calledBody as Record<string, unknown>).list;
    expect(Array.isArray(list)).toBe(true);
    if (Array.isArray(list)) {
      const first = list[0];
      expect(first && typeof first === "object" && !Array.isArray(first)).toBe(
        true,
      );
      if (first && typeof first === "object" && !Array.isArray(first)) {
        expect((first as Record<string, unknown>).templateParam).toEqual([
          "A",
          "B",
          "C",
        ]);
      }
    }
    expect(result.isSuccess).toBe(true);
  });

  test("SMS supports providerOptions.msgType override (e.g. GSMS)", async () => {
    let calledBody: Record<string, unknown> = {};

    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      calledBody = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;
      return new Response(
        JSON.stringify({
          resultCode: 14,
          message: "인증 요청이 올바르지 않습니다.",
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      from: "01000000000",
      text: "테스트",
      providerOptions: { msgType: "GSMS" },
    });

    expect(calledBody.msgType).toBe("GSMS");
    expect(result.isFailure).toBe(true);
  });

  test("MMS uses multipart/form-data with secret header and image", async () => {
    let calledUrl = "";
    let calledSecret = "";
    let calledBody: BodyInit | null = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledSecret = new Headers(init?.headers).get("secret") || "";
      calledBody = init?.body ?? null;

      return new Response(
        JSON.stringify({
          resultCode: 0,
          message: "전송 성공",
          requestNo: "REQ_1",
          msgType: "MMS",
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "MMS",
      to: "01012345678",
      from: "01000000000",
      text: "테스트",
      media: {
        image: {
          bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
          filename: "test.jpg",
          contentType: "image/jpeg",
        },
      },
    });

    expect(calledUrl).toBe("https://sms.bizservice.iwinv.kr/api/v2/send/");
    expect(calledSecret).toBe(
      Buffer.from("sms-api-key&sms-auth-key").toString("base64"),
    );
    expect(calledBody instanceof FormData).toBe(true);
    if (calledBody instanceof FormData) {
      expect(calledBody.get("version")).toBe("1.0");
      expect(calledBody.get("from")).toBe("01000000000");
      expect(calledBody.get("to")).toBe("01012345678");
      expect(calledBody.get("title")).toBe("테스트");
      expect(calledBody.get("text")).toBe("테스트");
      const image = calledBody.get("image");
      expect(image).toBeTruthy();
      expect(image instanceof Blob).toBe(true);
    }
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe("SENT");
      expect(result.value.providerMessageId).toBe("REQ_1");
    }
  });

  test("MMS fails when image is missing", async () => {
    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const result = await provider.send({
      type: "MMS",
      to: "01012345678",
      from: "01000000000",
      text: "테스트",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
    }
  });

  test("MMS scheduledAt returns PENDING and includes date field", async () => {
    let calledBody: BodyInit | null = null;

    globalThis.fetch = async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      calledBody = init?.body ?? null;
      return new Response(
        JSON.stringify({
          resultCode: 0,
          message: "전송 성공",
          requestNo: "REQ_2",
          msgType: "MMS",
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const scheduledAt = new Date("2030-01-01T00:00:00Z");

    const result = await provider.send({
      type: "MMS",
      to: "01012345678",
      from: "01000000000",
      text: "테스트",
      media: {
        image: { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]) },
      },
      options: { scheduledAt },
    });

    expect(calledBody instanceof FormData).toBe(true);
    if (calledBody instanceof FormData) {
      expect(calledBody.get("date")).toBe("2030-01-01 00:00:00");
    }
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe("PENDING");
    }
  });
});
