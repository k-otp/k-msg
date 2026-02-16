import { afterEach, describe, expect, test } from "bun:test";
import { IWINVProvider } from "./provider";

const originalFetch = globalThis.fetch;
const originalDateNow = Date.now;

afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalDateNow;
});

describe("IWINVProvider", () => {
  test("uses default AlimTalk base URL when baseUrl is omitted", async () => {
    let calledUrl = "";

    globalThis.fetch = async (input: RequestInfo | URL) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      return new Response(
        JSON.stringify({ code: 200, message: "ok", seqNo: 1 }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      debug: false,
    });

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateCode: "TPL_1",
      variables: { code: 1234 },
    });

    expect(result.isSuccess).toBe(true);
    expect(calledUrl).toBe("https://alimtalk.bizservice.iwinv.kr/api/v2/send/");
  });

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

  test("ALIMTALK maps failover options to IWINV resend fields", async () => {
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
        JSON.stringify({ code: 200, message: "ok", seqNo: 456 }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      debug: false,
    });

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      from: "01000000000",
      templateCode: "TPL_1",
      variables: { code: 1234 },
      failover: {
        enabled: true,
        fallbackChannel: "lms",
        fallbackTitle: "fallback title",
        fallbackContent: "fallback body",
      },
    });

    expect(calledBody.reSend).toBe("Y");
    expect(calledBody.resendType).toBe("Y");
    expect(calledBody.resendTitle).toBe("fallback title");
    expect(calledBody.resendContent).toBe("fallback body");
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.warnings).toBeUndefined();
    }
  });

  test("ALIMTALK maps numeric-only response code 501 to TEMPLATE_NOT_FOUND", async () => {
    globalThis.fetch = async () => new Response("501", { status: 200 });

    const provider = new IWINVProvider({
      apiKey: "api-key",
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

  test("getDeliveryStatus(ALIMTALK) queries history and maps delivered status", async () => {
    let calledUrl = "";
    let calledAuth = "";
    let calledBody: Record<string, unknown> = {};

    const fixedNow = new Date(2030, 0, 2, 3, 4, 5).getTime();
    Date.now = () => fixedNow;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledAuth = new Headers(init?.headers).get("AUTH") || "";
      calledBody = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;

      return new Response(
        JSON.stringify({
          code: 200,
          message: "데이터가 조회되었습니다.",
          totalCount: 1,
          list: [
            {
              seqNo: 17,
              phone: "01012345678",
              callback: "01000000000",
              templateCode: "TPL_1",
              sendMessage: "hi",
              reserve: "N",
              requestDate: "2030-01-01 00:00:00",
              sendDate: "2030-01-01 00:00:10",
              receiveDate: "2030-01-01 00:00:20",
              statusCode: "OK",
              statusCodeName: "성공",
              resendStatus: null,
              resendStatusName: null,
              buttons: {
                link1: null,
                link2: null,
                link3: null,
                link4: null,
                link5: null,
              },
            },
          ],
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      debug: false,
    });

    const requestedAt = new Date(2030, 0, 1, 0, 0, 0);
    const result = await provider.getDeliveryStatus({
      providerMessageId: "17",
      type: "ALIMTALK",
      to: "010-1234-5678",
      requestedAt,
    });

    expect(calledUrl).toBe("https://alimtalk.bizservice.iwinv.kr/api/history/");
    expect(calledAuth).toBe(Buffer.from("api-key", "utf8").toString("base64"));
    expect(calledBody.seqNo).toBe(17);
    expect(calledBody.phone).toBe("01012345678");
    expect(calledBody.pageNum).toBe(1);
    expect(calledBody.pageSize).toBe(15);
    expect(typeof calledBody.startDate).toBe("string");
    expect(typeof calledBody.endDate).toBe("string");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value?.status).toBe("DELIVERED");
      expect(result.value?.deliveredAt?.getTime()).toBe(
        new Date(2030, 0, 1, 0, 0, 20).getTime(),
      );
    }
  });

  test("getDeliveryStatus(SMS) queries v2 history and maps delivered status", async () => {
    let calledUrl = "";
    let calledSecret = "";
    let calledBody: Record<string, unknown> = {};

    const fixedNow = new Date(2030, 0, 2, 3, 4, 5).getTime();
    Date.now = () => fixedNow;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
      calledSecret = new Headers(init?.headers).get("secret") || "";
      calledBody = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;

      return new Response(
        JSON.stringify({
          resultCode: 0,
          message: "데이터가 조회되었습니다.",
          totalCount: 1,
          list: [
            {
              requestNo: "REQ_1",
              companyid: "cid",
              msgType: "SMS",
              phone: "01012345678",
              callback: "01000000000",
              sendStatusCode: "06",
              sendStatusMsg: "전송 성공",
              sendDate: "2030-01-01 00:00:10",
            },
          ],
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      smsCompanyId: "cid",
      debug: false,
    });

    const requestedAt = new Date(2030, 0, 1, 0, 0, 0);
    const result = await provider.getDeliveryStatus({
      providerMessageId: "REQ_1",
      type: "SMS",
      to: "010-1234-5678",
      requestedAt,
    });

    expect(calledUrl).toBe("https://sms.bizservice.iwinv.kr/api/history/");
    expect(calledSecret).toBe(
      Buffer.from("sms-api-key&sms-auth-key").toString("base64"),
    );
    expect(calledBody.companyid).toBe("cid");
    expect(calledBody.requestNo).toBe("REQ_1");
    expect(calledBody.phone).toBe("01012345678");
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value?.status).toBe("DELIVERED");
    }
  });

  test("getDeliveryStatus(SMS) keeps pending-like statuses as PENDING", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          resultCode: 0,
          message: "OK",
          list: [
            {
              requestNo: "REQ_2",
              sendStatusCode: "01",
              sendStatusMsg: "처리중",
            },
          ],
        }),
        { status: 200 },
      );

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      smsCompanyId: "company",
      debug: false,
    });

    const result = await provider.getDeliveryStatus({
      providerMessageId: "REQ_2",
      type: "SMS",
      to: "01012345678",
      requestedAt: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value?.status).toBe("PENDING");
    }
  });
  test("getDeliveryStatus(SMS) fails when smsCompanyId is missing", async () => {
    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      debug: false,
    });

    const result = await provider.getDeliveryStatus({
      providerMessageId: "REQ_1",
      type: "SMS",
      to: "01012345678",
      requestedAt: new Date(),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
    }
  });

  test("Template list uses AUTH header and maps status", async () => {
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
        JSON.stringify({
          code: 200,
          message: "ok",
          totalCount: 1,
          list: [
            {
              templateCode: "10036",
              templateName: "알림",
              templateContent: "#{이름} 고객님 감사합니다.",
              status: "Y",
              createDate: "2021-06-21 10:01:31",
              buttons: [],
            },
          ],
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      debug: false,
    });

    const result = await provider.listTemplates({ status: "APPROVED" });

    expect(calledUrl).toBe(
      "https://alimtalk.bizservice.iwinv.kr/api/template/",
    );
    expect(calledAuth).toBe(Buffer.from("api-key", "utf8").toString("base64"));
    expect(calledBody.templateStatus).toBe("Y");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value[0]?.code).toBe("10036");
      expect(result.value[0]?.status).toBe("APPROVED");
    }
  });

  test("Template create uses add endpoint and returns templateCode", async () => {
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
        JSON.stringify({
          code: 200,
          templateCode: "10031",
          message: "created",
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "api-key",
      debug: false,
    });

    const result = await provider.createTemplate({
      name: "템플릿명",
      content: "템플릿 내용",
    });

    expect(calledUrl).toBe(
      "https://alimtalk.bizservice.iwinv.kr/api/template/add/",
    );
    expect(calledAuth).toBe(Buffer.from("api-key", "utf8").toString("base64"));
    expect(calledBody.templateName).toBe("템플릿명");
    expect(calledBody.templateContent).toBe("템플릿 내용");

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.code).toBe("10031");
      expect(result.value.status).toBe("INSPECTION");
    }
  });

  test("Template get fails with TEMPLATE_NOT_FOUND when list is empty", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ code: 200, message: "ok", totalCount: 0, list: [] }),
        { status: 200 },
      );

    const provider = new IWINVProvider({
      apiKey: "api-key",
      debug: false,
    });

    const result = await provider.getTemplate("99999");
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("TEMPLATE_NOT_FOUND");
    }
  });
});
