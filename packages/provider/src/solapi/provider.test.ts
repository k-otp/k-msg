import { describe, expect, test } from "bun:test";
import type { StandardRequest } from "@k-msg/core";
import { SolapiAdapter } from "../adapters/solapi.adapter";
import { SolapiProvider } from "./provider";
import type { SolapiConfig } from "./types/solapi";

function createStubClient() {
  const calls: any = {
    sendOne: [],
    getBalance: 0,
    getMessages: [],
    uploadFile: [],
  };

  const client: any = {
    sendOne: async (message: any, appId?: string) => {
      calls.sendOne.push({ message, appId });
      return {
        groupId: "group_1",
        to: message.to,
        from: message.from,
        type: message.type,
        statusMessage: "accepted",
        country: message.country ?? "82",
        messageId: "msg_1",
        statusCode: "2000",
        accountId: "acc_1",
      };
    },
    getBalance: async () => {
      calls.getBalance += 1;
      return { balance: 1234, point: 0 };
    },
    getMessages: async (query?: any) => {
      calls.getMessages.push(query);
      return {
        startKey: query?.startKey ?? null,
        nextKey: "next_1",
        limit: query?.limit ?? 15,
        messageList: {
          a: {
            messageId: "m1",
            to: query?.to ?? "01012345678",
            from: query?.from ?? "01000000000",
            type: query?.type ?? "SMS",
            statusCode: "2000",
            statusMessage: "ok",
            dateSent: "2021-01-01T00:00:00.000Z",
          },
        },
      };
    },
    uploadFile: async (filePath: string, fileType: string, name?: string, link?: string) => {
      calls.uploadFile.push({ filePath, fileType, name, link });
      return { fileId: `${fileType}_file_1` };
    },
  };

  return { client, calls };
}

describe("SolapiProvider/Adapter (UniversalProvider-based)", () => {
  test("maps SMS StandardRequest to solapi sendOne()", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        defaultFrom: "01000000000",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const request: StandardRequest = {
      channel: "SMS",
      templateCode: "SMS_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "hello" },
      text: "hello",
      options: { senderNumber: "01000000000" },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne).toHaveLength(1);
    expect(calls.sendOne[0]?.message?.type).toBe("SMS");
    expect(calls.sendOne[0]?.message?.to).toBe("01012345678");
    expect(calls.sendOne[0]?.message?.from).toBe("01000000000");
    expect(calls.sendOne[0]?.message?.text).toBe("hello");
  });

  test("maps ALIMTALK to ATA with kakaoOptions", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        kakaoPfId: "pf_default",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const request: StandardRequest = {
      channel: "ALIMTALK",
      templateCode: "TPL_1",
      phoneNumber: "01012345678",
      variables: { name: "tester", code: 1234 },
      options: { kakaoOptions: { pfId: "pf_1" } },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne[0]?.message?.type).toBe("ATA");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.pfId).toBe("pf_1");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.templateId).toBe("TPL_1");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.variables?.code).toBe("1234");
  });

  test("maps FRIENDTALK image to CTI and uploads KAKAO file with link", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        kakaoPfId: "pf_1",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const request: StandardRequest = {
      channel: "FRIENDTALK",
      templateCode: "FRIENDTALK_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "hi" },
      text: "hi",
      imageUrl: "https://example.com/a.png",
      buttons: [
        { name: "go", type: "WL", urlMobile: "https://m.example.com" },
      ],
      options: { kakaoOptions: { pfId: "pf_1" } },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.uploadFile).toHaveLength(1);
    expect(calls.uploadFile[0]?.fileType).toBe("KAKAO");
    expect(calls.uploadFile[0]?.link).toBe("https://m.example.com");
    expect(calls.sendOne[0]?.message?.type).toBe("CTI");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.imageId).toBe("KAKAO_file_1");
  });

  test("maps RCS_SMS to RCS with brandId", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        defaultFrom: "01000000000",
        rcsBrandId: "brand_1",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const request: StandardRequest = {
      channel: "RCS_SMS",
      templateCode: "RCS_SMS_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "rcs hi" },
      text: "rcs hi",
      options: { senderNumber: "01000000000" },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne[0]?.message?.type).toBe("RCS_SMS");
    expect(calls.sendOne[0]?.message?.rcsOptions?.brandId).toBe("brand_1");
  });

  test("exposes getSmsCharge via adapter", async () => {
    const { client } = createStubClient();
    const adapter = new SolapiAdapter(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const balance = await adapter.getSmsCharge();
    expect(balance).toBe(1234);
  });

  test("getSmsHistory maps getMessages into list/nextKey", async () => {
    const { client, calls } = createStubClient();
    const adapter = new SolapiAdapter(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const result = await adapter.getSmsHistory({
      channel: "SMS",
      startDate: "2021-01-01",
      endDate: "2021-01-02",
      pageNum: 1,
      pageSize: 10,
      phone: "010-1234-5678",
    });

    expect(calls.getMessages).toHaveLength(1);
    expect(calls.getMessages[0]?.type).toBe("SMS");
    expect(calls.getMessages[0]?.limit).toBe(10);
    expect(calls.getMessages[0]?.to).toBe("01012345678");
    expect(result.totalCount).toBe(1);
    expect(result.nextKey).toBe("next_1");
    expect(result.list).toHaveLength(1);
  });
});

