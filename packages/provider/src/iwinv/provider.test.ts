import { afterEach, describe, expect, test } from "bun:test";
import type { StandardRequest } from "@k-msg/core";
import { IWINVProvider } from "./provider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("IWINVProvider SMS/ALIMTALK behaviors", () => {
  test("calls SMS v2 endpoint with Secret header and v2 payload", async () => {
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

    const request: StandardRequest = {
      channel: "SMS",
      templateCode: "SMS_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "테스트" },
      text: "테스트",
      options: { senderNumber: "01000000000" },
    };

    const result = await provider.send(request);

    expect(calledUrl).toBe("https://sms.bizservice.iwinv.kr/api/v2/send/");
    expect(calledSecret).toBe(
      Buffer.from("sms-api-key&sms-auth-key").toString("base64"),
    );
    expect(calledBody.version).toBe("1.0");
    expect(calledBody.from).toBe("01000000000");
    expect(calledBody.to).toEqual(["01012345678"]);
    expect(calledBody.text).toBe("테스트");
    expect(calledBody.msgType).toBe("SMS");
    expect(result.status).toBe("FAILED");
    expect(result.error?.code).toBe("AUTHENTICATION_FAILED");
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

    const request: StandardRequest = {
      channel: "SMS",
      templateCode: "SMS_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "테스트" },
      text: "테스트",
      options: { senderNumber: "01000000000" },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("FAILED");
    expect(result.error?.message).toContain("SMS API 인증 실패");
  });

  test("retries unregistered IP response and annotates final error", async () => {
    let fetchCalls = 0;
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return new Response(
        JSON.stringify({
          code: 206,
          message: "등록하지 않은 IP에서는 발송되지 않습니다.",
        }),
        { status: 200 },
      );
    };

    const provider = new IWINVProvider({
      apiKey: "test-api-key",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      debug: false,
      ipRetryCount: 2,
      ipRetryDelayMs: 1,
    });

    const request: StandardRequest = {
      channel: "ALIMTALK",
      templateCode: "R000000044_23312",
      phoneNumber: "01012345678",
      variables: {},
    };

    const result = await provider.send(request);

    expect(fetchCalls).toBe(3);
    expect(result.status).toBe("FAILED");
    expect(result.error?.message).toContain("3회 재시도");
    expect(result.error?.details?.ipRetryAttempts).toBe(3);
    expect(result.metadata?.ipRetryAttempts).toBe(3);
  });

  test("supports SMS charge and history queries (v2)", async () => {
    const calls: Array<{
      url: string;
      secret: string;
      body: Record<string, unknown>;
    }> = [];

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const secret = new Headers(init?.headers).get("secret") || "";
      const body = JSON.parse((init?.body as string) || "{}") as Record<
        string,
        unknown
      >;
      calls.push({ url, secret, body });

      if (url.endsWith("/api/charge/")) {
        return new Response(
          JSON.stringify({ code: 0, message: "ok", charge: 10000 }),
          { status: 200 },
        );
      }

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

    const provider = new IWINVProvider({
      apiKey: "api-key",
      smsApiKey: "sms-api-key",
      smsAuthKey: "sms-auth-key",
      smsCompanyId: "koreav",
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
      smsBaseUrl: "https://sms.bizservice.iwinv.kr",
      debug: false,
    });

    const charge = await provider.getSmsCharge();
    const history = await provider.getSmsHistory({
      startDate: "2021-04-05",
      endDate: "2021-06-23",
      pageNum: 1,
      pageSize: 15,
      phone: "010-0000-0000",
    });

    expect(charge).toBe(10000);
    expect(history.totalCount).toBe(1);
    expect(history.list.length).toBe(1);

    expect(calls[0]?.url).toBe("https://sms.bizservice.iwinv.kr/api/charge/");
    expect(calls[1]?.url).toBe("https://sms.bizservice.iwinv.kr/api/history/");
    expect(calls[0]?.secret).toBe(
      Buffer.from("sms-api-key&sms-auth-key").toString("base64"),
    );
    expect(calls[1]?.body.companyid).toBe("koreav");
  });
});
