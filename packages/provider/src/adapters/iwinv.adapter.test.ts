import { describe, expect, test } from "bun:test";
import type { StandardRequest } from "@k-msg/core";
import { IWINVAdapter } from "./iwinv.adapter";

const originalFetch = globalThis.fetch;

describe("IWINVAdapter adaptRequest", () => {
  const adapter = new IWINVAdapter({
    apiKey: "test-api-key",
    baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    senderNumber: "029999999",
  });

  test("builds direct message payload for SMS channel", () => {
    const request: StandardRequest = {
      channel: "SMS",
      templateCode: "SMS_DIRECT",
      phoneNumber: "01012345678",
      variables: { code: "123456" },
      text: "인증번호는 123456 입니다.",
      options: {
        subject: "인증안내",
        senderNumber: "021111111",
      },
    };

    const payload = adapter.adaptRequest(request);

    expect(payload.templateCode).toBe("SMS_DIRECT");
    expect(payload.resendType).toBe("N");
    expect(payload.resendContent).toBe("인증번호는 123456 입니다.");
    expect(payload.resendTitle).toBe("인증안내");
    expect(payload.resendCallback).toBe("021111111");
    expect(payload.list[0]?.templateParam).toBeUndefined();
  });

  test("keeps template params for template-based channels", () => {
    const request: StandardRequest = {
      channel: "ALIMTALK",
      templateCode: "WELCOME_001",
      phoneNumber: "01099998888",
      variables: {
        name: "홍길동",
        service: "k-msg",
      },
    };

    const payload = adapter.adaptRequest(request);

    expect(payload.templateCode).toBe("WELCOME_001");
    expect(payload.resendType).toBe("Y");
    expect(payload.list[0]?.templateParam).toEqual(["홍길동", "k-msg"]);
  });

  test("maps AlimTalk validation code as non-retryable invalid request", () => {
    const mapped = adapter.mapError({
      code: 505,
      message:
        "발신번호는 발신번호 관리에서 사전에 등록된 발신번호로만 발송이 가능합니다.",
    });

    expect(mapped.code).toBe("INVALID_REQUEST");
    expect(mapped.retryable).toBe(false);
  });

  test("maps AlimTalk insufficient balance code correctly", () => {
    const mapped = adapter.mapError({
      code: 519,
      message: "잔액이 부족합니다.",
    });

    expect(mapped.code).toBe("INSUFFICIENT_BALANCE");
    expect(mapped.retryable).toBe(false);
  });
});

describe("IWINVAdapter getAuthHeaders", () => {
  test("builds AUTH base64 header in Node-compatible way", () => {
    const adapter = new IWINVAdapter({
      apiKey: "test-api-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    });

    const headers = adapter.getAuthHeaders();

    expect(headers["Content-Type"]).toBe("application/json;charset=UTF-8");
    expect(headers.AUTH).toBe(
      Buffer.from("test-api-key", "utf8").toString("base64"),
    );
  });

  test("includes X-Forwarded-For and merges extra headers (overridable)", () => {
    const adapter = new IWINVAdapter({
      apiKey: "test-api-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      xForwardedFor: "1.1.1.1",
      extraHeaders: {
        "X-Forwarded-For": "2.2.2.2",
        "X-Custom": "ok",
      },
    });

    const headers = adapter.getAuthHeaders();

    // extraHeaders should override the default XFF value.
    expect(headers["X-Forwarded-For"]).toBe("2.2.2.2");
    expect(headers["X-Custom"]).toBe("ok");
  });
});

describe("IWINVAdapter SMS v2 utilities", () => {
  test("calls SMS charge endpoint with Secret header", async () => {
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
        JSON.stringify({ code: 0, message: "ok", charge: 12345 }),
        { status: 200 },
      );
    };

    const adapter = new IWINVAdapter({
      apiKey: "alimtalk-api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    });

    const charge = await adapter.getSmsCharge();

    expect(calledUrl).toBe("https://sms.bizservice.iwinv.kr/api/charge/");
    expect(calledSecret).toBe(
      Buffer.from("sms-api-key&sms-auth-key").toString("base64"),
    );
    expect(calledBody.version).toBe("1.0");
    expect(charge).toBe(12345);

    globalThis.fetch = originalFetch;
  });

  test("calls SMS history endpoint and enforces 90-day window", async () => {
    let calledUrl = "";
    let calledBody: Record<string, unknown> = {};

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      calledUrl = typeof input === "string" ? input : input.toString();
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
              requestNo: 241640246571,
              companyid: "koreav",
              msgType: "SMS",
              phone: "01000000000",
              callback: "16884879",
              sendStatus: "전송 성공",
              sendDate: "2021-01-01 15:22:40",
            },
          ],
        }),
        { status: 200 },
      );
    };

    const adapter = new IWINVAdapter({
      apiKey: "alimtalk-api-key",
      smsAuthKey: "legacy-auth-key",
      smsCompanyId: "koreav",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    });

    const result = await adapter.getSmsHistory({
      startDate: "2021-04-05",
      endDate: "2021-06-23",
      pageNum: 1,
      pageSize: 15,
      phone: "010-0000-0000",
    });

    expect(calledUrl).toBe("https://sms.bizservice.iwinv.kr/api/history/");
    expect(calledBody.companyid).toBe("koreav");
    expect(calledBody.startDate).toBe("2021-04-05");
    expect(calledBody.endDate).toBe("2021-06-23");
    expect(calledBody.pageNum).toBe(1);
    expect(calledBody.pageSize).toBe(15);
    expect(calledBody.phone).toBe("010-0000-0000");
    expect(result.totalCount).toBe(1);
    expect(result.list.length).toBe(1);

    await expect(
      adapter.getSmsHistory({
        companyId: "koreav",
        startDate: "2021-01-01",
        endDate: "2021-04-15",
      }),
    ).rejects.toThrow("90일 이내");

    globalThis.fetch = originalFetch;
  });
});
