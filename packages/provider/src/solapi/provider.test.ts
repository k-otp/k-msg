import { describe, expect, test } from "bun:test";
import { SolapiProvider, type SolapiSdkClient } from "./provider";
import type { SolapiConfig } from "./types/solapi";

function createStubClient() {
  type SendOneRequest = Parameters<SolapiSdkClient["sendOne"]>[0];
  type SendOneResponse = Awaited<ReturnType<SolapiSdkClient["sendOne"]>>;
  type UploadFileResponse = Awaited<ReturnType<SolapiSdkClient["uploadFile"]>>;
  type GetBalanceResponse = Awaited<ReturnType<SolapiSdkClient["getBalance"]>>;
  type GetMessagesResponse = Awaited<
    ReturnType<SolapiSdkClient["getMessages"]>
  >;

  const calls: {
    sendOne: Array<{ message: Record<string, unknown>; appId?: string }>;
    uploadFile: Array<{
      filePath: string;
      fileType: string;
      name?: string;
      link?: string;
    }>;
    getMessages: Array<{ params?: Record<string, unknown> }>;
  } = {
    sendOne: [],
    uploadFile: [],
    getMessages: [],
  };

  let getMessagesResponse: GetMessagesResponse = ({
    messageList: {},
  } as unknown) as GetMessagesResponse;

  const client: SolapiSdkClient = {
    sendOne: async (message: SendOneRequest, appId?: string) => {
      calls.sendOne.push({
        message: message as unknown as Record<string, unknown>,
        appId,
      });
      return { messageId: "msg_1" } as unknown as SendOneResponse;
    },
    uploadFile: async (
      filePath: string,
      fileType: string,
      name?: string,
      link?: string,
    ) => {
      calls.uploadFile.push({ filePath, fileType, name, link });
      return {
        fileId: `${fileType}_file_${calls.uploadFile.length}`,
      } as unknown as UploadFileResponse;
    },
    getBalance: async () =>
      ({ balance: 0, point: 0 }) as unknown as GetBalanceResponse,
    getMessages: async (data?: unknown) => {
      calls.getMessages.push({
        params: (data as Record<string, unknown> | undefined) ?? undefined,
      });
      return getMessagesResponse;
    },
  };

  return {
    client,
    calls,
    setGetMessagesResponse: (value: GetMessagesResponse) => {
      getMessagesResponse = value;
    },
  };
}

describe("SolapiProvider (SendOptions-based)", () => {
  test("sends SMS via sendOne() with defaultFrom fallback", async () => {
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

    const result = await provider.send({
      type: "SMS",
      to: "01012345678",
      text: "hello",
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.sendOne).toHaveLength(1);
    expect(calls.sendOne[0]?.message?.type).toBe("SMS");
    expect(calls.sendOne[0]?.message?.to).toBe("01012345678");
    expect(calls.sendOne[0]?.message?.from).toBe("01000000000");
    expect(calls.sendOne[0]?.message?.text).toBe("hello");
  });

  test("sends ALIMTALK as ATA with kakaoOptions (pfId/templateId/variables)", async () => {
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

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateCode: "TPL_1",
      variables: { code: 1234 },
      kakao: { profileId: "pf_1" },
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.sendOne[0]?.message?.type).toBe("ATA");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.pfId).toBe("pf_1");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.templateId).toBe("TPL_1");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.variables?.code).toBe(
      "1234",
    );
  });

  test("sends FRIENDTALK image as CTI and uploads KAKAO file with link", async () => {
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

    const result = await provider.send({
      type: "FRIENDTALK",
      to: "01012345678",
      text: "hi",
      imageUrl: "https://example.com/a.png",
      buttons: [{ name: "go", type: "WL", urlMobile: "https://m.example.com" }],
      kakao: { profileId: "pf_1" },
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.uploadFile).toHaveLength(1);
    expect(calls.uploadFile[0]?.fileType).toBe("KAKAO");
    expect(calls.uploadFile[0]?.link).toBe("https://m.example.com");
    expect(calls.sendOne[0]?.message?.type).toBe("CTI");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.imageId).toBe(
      "KAKAO_file_1",
    );
  });

  test("sends FRIENDTALK image as CTI with media.image.ref (imageUrl alias)", async () => {
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

    const result = await provider.send({
      type: "FRIENDTALK",
      to: "01012345678",
      text: "hi",
      media: {
        image: { ref: "https://example.com/a.png" },
      },
      buttons: [{ name: "go", type: "WL", urlMobile: "https://m.example.com" }],
      kakao: { profileId: "pf_1" },
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.uploadFile).toHaveLength(1);
    expect(calls.uploadFile[0]?.fileType).toBe("KAKAO");
    expect(calls.uploadFile[0]?.filePath).toBe("https://example.com/a.png");
    expect(calls.uploadFile[0]?.link).toBe("https://m.example.com");
    expect(calls.sendOne[0]?.message?.type).toBe("CTI");
    expect(calls.sendOne[0]?.message?.kakaoOptions?.imageId).toBe(
      "KAKAO_file_1",
    );
  });

  test("sends MMS by uploading media.image.ref", async () => {
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

    const result = await provider.send({
      type: "MMS",
      to: "01012345678",
      from: "01000000000",
      text: "mms hi",
      media: {
        image: { ref: "https://example.com/mms.jpg" },
      },
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.uploadFile).toHaveLength(1);
    expect(calls.uploadFile[0]?.fileType).toBe("MMS");
    expect(calls.uploadFile[0]?.filePath).toBe("https://example.com/mms.jpg");
    expect(calls.sendOne[0]?.message?.type).toBe("MMS");
    expect(calls.sendOne[0]?.message?.imageId).toBe("MMS_file_1");
  });

  test("MMS requires an image (imageUrl or media.image.ref)", async () => {
    const { client } = createStubClient();
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

    const result = await provider.send({
      type: "MMS",
      to: "01012345678",
      from: "01000000000",
      text: "mms hi",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe("INVALID_REQUEST");
    }
  });

  test("sends NSA with naverOptions (talkId/templateId/variables merge)", async () => {
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

    const result = await provider.send({
      type: "NSA",
      to: "01012345678",
      templateCode: "NSA_TPL_1",
      variables: { name: "tester", code: 1234 },
      naver: {
        talkId: "talk_1",
        disableSms: true,
        variables: { code: "9999" },
      },
    });

    expect(result.isSuccess).toBe(true);
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

  test("sends RCS_MMS additionalBody.imageId as additionalBody.imaggeId", async () => {
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

    const result = await provider.send({
      type: "RCS_MMS",
      to: "01012345678",
      text: "rcs hi",
      subject: "RCS Title",
      rcs: {
        brandId: "brand_1",
        copyAllowed: true,
        additionalBody: { imageId: "rcs_image_1" },
      },
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.sendOne[0]?.message?.type).toBe("RCS_MMS");
    expect(calls.sendOne[0]?.message?.rcsOptions?.brandId).toBe("brand_1");
    expect(
      calls.sendOne[0]?.message?.rcsOptions?.additionalBody?.imaggeId,
    ).toBe("rcs_image_1");
  });

  test("sends VOICE with default voiceType", async () => {
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

    const result = await provider.send({
      type: "VOICE",
      to: "01012345678",
      text: "voice hi",
    });

    expect(result.isSuccess).toBe(true);
    expect(calls.sendOne[0]?.message?.type).toBe("VOICE");
    expect(calls.sendOne[0]?.message?.voiceOptions?.voiceType).toBe("FEMALE");
  });

  test("sends FAX by uploading fileUrls and mapping to faxOptions.fileIds", async () => {
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

    const result = await provider.send({
      type: "FAX",
      to: "01012345678",
      fax: {
        fileUrls: ["https://example.com/a.pdf", "https://example.com/b.pdf"],
      },
    });

    expect(result.isSuccess).toBe(true);
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

  test("getDeliveryStatus returns null when message is not found", async () => {
    const { client, calls } = createStubClient();
    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const result = await provider.getDeliveryStatus({
      providerMessageId: "msg_404",
      type: "SMS",
      to: "01012345678",
      requestedAt: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toBe(null);
    }
    expect(calls.getMessages).toHaveLength(1);
    expect(calls.getMessages[0]?.params?.messageId).toBe("msg_404");
  });

  test("getDeliveryStatus maps statusCode and timestamps", async () => {
    const { client, setGetMessagesResponse } = createStubClient();
    setGetMessagesResponse({
      messageList: {
        msg_1: {
          messageId: "msg_1",
          statusCode: "4000",
          dateSent: "2026-01-01T00:00:00.000Z",
          dateCompleted: "2026-01-01T00:00:10.000Z",
        },
      },
    } as any);

    const provider = new SolapiProvider(
      {
        apiKey: "key",
        apiSecret: "secret",
        baseUrl: "https://api.solapi.com",
        debug: false,
      } satisfies SolapiConfig,
      client,
    );

    const result = await provider.getDeliveryStatus({
      providerMessageId: "msg_1",
      type: "SMS",
      to: "01012345678",
      requestedAt: new Date(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value?.status).toBe("DELIVERED");
      expect(result.value?.sentAt instanceof Date).toBe(true);
      expect(result.value?.deliveredAt instanceof Date).toBe(true);
      expect(result.value?.statusCode).toBe("4000");
    }
  });
});
