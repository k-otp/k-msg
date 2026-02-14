import { describe, expect, test } from "bun:test";
import type { StandardRequest } from "@k-msg/core";
import type {
  FileType,
  GetMessagesRequest,
  RequestSendOneMessageSchema,
} from "solapi";
import { SolapiAdapter } from "../adapters/solapi.adapter";
import { SolapiProvider } from "./provider";
import type { SolapiConfig } from "./types/solapi";

function createStubClient() {
  type SendOneCall = { message: RequestSendOneMessageSchema; appId?: string };
  type GetMessagesCall = Readonly<GetMessagesRequest> | undefined;
  type UploadFileCall = {
    filePath: string;
    fileType: FileType;
    name?: string;
    link?: string;
  };

  const calls: {
    sendOne: SendOneCall[];
    getBalance: number;
    getMessages: GetMessagesCall[];
    uploadFile: UploadFileCall[];
  } = {
    sendOne: [],
    getBalance: 0,
    getMessages: [],
    uploadFile: [],
  };

  const client = {
    sendOne: async (message: RequestSendOneMessageSchema, appId?: string) => {
      calls.sendOne.push({ message, appId });
      return {
        groupId: "group_1",
        to: message.to,
        from: message.from,
        type: message.type,
        statusMessage: "accepted",
        country: "82",
        messageId: "msg_1",
        statusCode: "2000",
        accountId: "acc_1",
      };
    },
    getBalance: async () => {
      calls.getBalance += 1;
      return { balance: 1234, point: 0 };
    },
    getMessages: async (query?: Readonly<GetMessagesRequest>) => {
      calls.getMessages.push(query);
      return {
        startKey: query?.startKey ?? null,
        nextKey: "next_1",
        limit: query?.limit ?? 15,
        messageList: {
          a: {
            messageId: "m1",
            to: query?.to ?? "01012345678",
            from: "01000000000",
            type: query?.type ?? "SMS",
            statusCode: "2000",
            statusMessage: "ok",
            dateSent: "2021-01-01T00:00:00.000Z",
          },
        },
      };
    },
    uploadFile: async (
      filePath: string,
      fileType: FileType,
      name?: string,
      link?: string,
    ) => {
      calls.uploadFile.push({ filePath, fileType, name, link });
      return { fileId: `${fileType}_file_${calls.uploadFile.length}` };
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
    expect(calls.sendOne[0]?.message?.kakaoOptions?.variables?.code).toBe(
      "1234",
    );
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
      buttons: [{ name: "go", type: "WL", urlMobile: "https://m.example.com" }],
      options: { kakaoOptions: { pfId: "pf_1" } },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.uploadFile).toHaveLength(1);
    expect(calls.uploadFile[0]?.fileType).toBe("KAKAO");
    expect(calls.uploadFile[0]?.link).toBe("https://m.example.com");
    expect(calls.sendOne[0]?.message?.type).toBe("CTI");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.imageId).toBe(
      "KAKAO_file_1",
    );
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

  test("maps NSA to naverOptions with talkId/templateId/variables", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        naverTalkId: "talk_default",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const request: StandardRequest = {
      channel: "NSA",
      templateCode: "NSA_TPL_1",
      phoneNumber: "01012345678",
      variables: { name: "tester", code: 1234 },
      options: {
        naverOptions: {
          talkId: "talk_1",
          disableSms: true,
          variables: { code: "9999" },
        },
      },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne[0]?.message?.type).toBe("NSA");
    expect(calls.sendOne[0]?.message?.naverOptions?.talkId).toBe("talk_1");
    expect(calls.sendOne[0]?.message?.naverOptions?.templateId).toBe(
      "NSA_TPL_1",
    );
    expect(calls.sendOne[0]?.message?.naverOptions?.disableSms).toBe(true);
    expect(calls.sendOne[0]?.message?.naverOptions?.variables?.name).toBe(
      "tester",
    );
    expect(calls.sendOne[0]?.message?.naverOptions?.variables?.code).toBe(
      "9999",
    );
  });

  test("maps VOICE to voiceOptions with default voiceType", async () => {
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
      channel: "VOICE",
      templateCode: "VOICE_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "voice hi" },
      text: "voice hi",
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne[0]?.message?.type).toBe("VOICE");
    expect(calls.sendOne[0]?.message?.text).toBe("voice hi");
    expect(calls.sendOne[0]?.message?.voiceOptions?.voiceType).toBe("FEMALE");
  });

  test("maps VOICE to voiceOptions with overrides", async () => {
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
      channel: "VOICE",
      templateCode: "VOICE_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "voice hi" },
      text: "voice hi",
      options: {
        voiceOptions: {
          voiceType: "MALE",
          headerMessage: "head",
        },
      },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne[0]?.message?.type).toBe("VOICE");
    expect(calls.sendOne[0]?.message?.voiceOptions?.voiceType).toBe("MALE");
    expect(calls.sendOne[0]?.message?.voiceOptions?.headerMessage).toBe("head");
  });

  test("maps FAX to faxOptions with fileIds (no upload)", async () => {
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
      channel: "FAX",
      templateCode: "FAX_DIRECT",
      phoneNumber: "01012345678",
      variables: {},
      options: { faxOptions: { fileIds: ["fax_file_1", "fax_file_2"] } },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.uploadFile).toHaveLength(0);
    expect(calls.sendOne[0]?.message?.type).toBe("FAX");
    expect(calls.sendOne[0]?.message?.faxOptions?.fileIds).toEqual([
      "fax_file_1",
      "fax_file_2",
    ]);
  });

  test("maps FAX to faxOptions by uploading fileUrls", async () => {
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
      channel: "FAX",
      templateCode: "FAX_DIRECT",
      phoneNumber: "01012345678",
      variables: {},
      options: {
        faxOptions: {
          fileUrls: ["https://example.com/a.pdf", "https://example.com/b.pdf"],
        },
      },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.uploadFile).toHaveLength(2);
    expect(calls.uploadFile[0]?.fileType).toBe("FAX");
    expect(calls.uploadFile[0]?.filePath).toBe("https://example.com/a.pdf");
    expect(calls.uploadFile[1]?.fileType).toBe("FAX");
    expect(calls.uploadFile[1]?.filePath).toBe("https://example.com/b.pdf");
    expect(calls.sendOne[0]?.message?.type).toBe("FAX");
    expect(calls.sendOne[0]?.message?.faxOptions?.fileIds).toEqual([
      "FAX_file_1",
      "FAX_file_2",
    ]);
  });

  test("maps RCS additionalBody imageId to imaggeId and passes RCS options", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        defaultFrom: "01000000000",
        rcsBrandId: "brand_default",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const request: StandardRequest = {
      channel: "RCS_MMS",
      templateCode: "RCS_MMS_DIRECT",
      phoneNumber: "01012345678",
      variables: { message: "rcs hi", foo: "base" },
      text: "rcs hi",
      options: {
        senderNumber: "01000000000",
        rcsOptions: {
          brandId: "brand_1",
          copyAllowed: true,
          mmsType: "M3",
          commercialType: true,
          variables: { foo: "override", bar: "1" },
          additionalBody: {
            title: "RCS Title",
            description: "RCS Desc",
            imageId: "rcs_image_1",
          },
        },
      },
    };

    const result = await provider.send(request);

    expect(result.status).toBe("SENT");
    expect(calls.sendOne[0]?.message?.type).toBe("RCS_MMS");
    expect(calls.sendOne[0]?.message?.rcsOptions?.brandId).toBe("brand_1");
    expect(calls.sendOne[0]?.message?.rcsOptions?.copyAllowed).toBe(true);
    expect(calls.sendOne[0]?.message?.rcsOptions?.mmsType).toBe("M3");
    expect(calls.sendOne[0]?.message?.rcsOptions?.commercialType).toBe(true);
    expect(calls.sendOne[0]?.message?.rcsOptions?.variables?.foo).toBe(
      "override",
    );
    expect(
      calls.sendOne[0]?.message?.rcsOptions?.additionalBody?.imaggeId,
    ).toBe("rcs_image_1");
    expect(calls.sendOne[0]?.message?.rcsOptions?.additionalBody?.title).toBe(
      "RCS Title",
    );
    expect(
      calls.sendOne[0]?.message?.rcsOptions?.additionalBody?.description,
    ).toBe("RCS Desc");
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
