import { describe, expect, spyOn, test } from "bun:test";
import { AligoAdapter } from "./aligo.adapter";

describe("AligoAdapter", () => {
  const config = {
    apiKey: "test-api-key",
    userId: "test-user",
    senderKey: "test-sender-key",
    sender: "01012345678",
  };

  test("should be instantiated", () => {
    const adapter = new AligoAdapter(config);
    expect(adapter.id).toBe("aligo");
    expect(adapter.name).toBe("Aligo Smart SMS");
  });

  test("should route to SMS host for SMS type", async () => {
    const adapter = new AligoAdapter(config);

    const fetchMock = spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result_code: "1",
            message: "success",
            msg_id: "12345",
          }),
        ),
      ),
    );

    const result = await adapter.send({
      type: "SMS",
      to: "01011112222",
      from: "01012345678",
      text: "Hello Test",
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.messageId).toBe("12345");
    }

    expect(fetchMock).toHaveBeenCalled();
    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("apis.aligo.in");

    fetchMock.mockRestore();
  });

  test("should route to AlimTalk host for ALIMTALK type", async () => {
    const adapter = new AligoAdapter(config);

    const fetchMock = spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result_code: "0",
            message: "success",
            msg_id: "67890",
          }),
        ),
      ),
    );

    const result = await adapter.send({
      type: "ALIMTALK",
      to: "01011112222",
      from: "01012345678",
      templateId: "TEST_TPL",
      variables: { name: "User" },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.messageId).toBe("67890");
    }

    expect(fetchMock).toHaveBeenCalled();
    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("kakaoapi.aligo.in");

    fetchMock.mockRestore();
  });

  test("should route to FriendTalk endpoint for FRIENDTALK type", async () => {
    const adapter = new AligoAdapter(config);

    const fetchMock = spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result_code: "0",
            message: "success",
            msg_id: "friend-legacy-1",
          }),
        ),
      ),
    );

    const result = await adapter.send({
      type: "FRIENDTALK",
      to: "01011112222",
      from: "01012345678",
      text: "친구톡 프로모션",
      buttons: [
        { name: "자세히 보기", type: "WL", urlPc: "https://example.com" },
      ],
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.messageId).toBe("friend-legacy-1");
    }

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("kakaoapi.aligo.in/akv10/friendtalk/send/");

    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.get("receiver_1")).toBe("01011112222");
    expect(form.get("message_1")).toBe("친구톡 프로모션");
    expect(form.get("button_1")).toContain("자세히 보기");

    fetchMock.mockRestore();
  });

  test("should route StandardRequest SMS to SMS endpoint", async () => {
    const adapter = new AligoAdapter(config);

    const fetchMock = spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result_code: "1",
            message: "success",
            msg_id: "sms-standard-1",
          }),
        ),
      ),
    );

    const result = await adapter.sendStandard({
      channel: "SMS",
      templateCode: "SMS_DIRECT",
      phoneNumber: "01011112222",
      variables: { code: "123456" },
      text: "인증번호 123456",
      options: {
        senderNumber: "021111111",
      },
    });

    expect(result.status).toBe("SENT");
    expect(result.messageId).toBe("sms-standard-1");
    expect(result.metadata?.channel).toBe("sms");

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("apis.aligo.in/send/");

    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.get("msg_type")).toBe("SMS");
    expect(form.get("receiver")).toBe("01011112222");
    expect(form.get("msg")).toBe("인증번호 123456");

    fetchMock.mockRestore();
  });

  test("should route StandardRequest ALIMTALK to AlimTalk endpoint", async () => {
    const adapter = new AligoAdapter(config);

    const fetchMock = spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result_code: "0",
            message: "success",
            msg_id: "alim-standard-1",
          }),
        ),
      ),
    );

    const result = await adapter.sendStandard({
      channel: "ALIMTALK",
      templateCode: "WELCOME_001",
      phoneNumber: "01011112222",
      variables: { name: "홍길동" },
      text: "홍길동님 환영합니다",
      options: {
        subject: "가입안내",
      },
    });

    expect(result.status).toBe("SENT");
    expect(result.messageId).toBe("alim-standard-1");
    expect(result.metadata?.channel).toBe("alimtalk");

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("kakaoapi.aligo.in/akv10/alimtalk/send/");

    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.get("tpl_code")).toBe("WELCOME_001");
    expect(form.get("receiver_1")).toBe("01011112222");
    expect(form.get("message_1")).toBe("홍길동님 환영합니다");

    fetchMock.mockRestore();
  });

  test("should route StandardRequest FRIENDTALK to FriendTalk endpoint", async () => {
    const adapter = new AligoAdapter(config);

    const fetchMock = spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            result_code: "0",
            message: "success",
            msg_id: "friend-standard-1",
          }),
        ),
      ),
    );

    const result = await adapter.sendStandard({
      channel: "FRIENDTALK",
      templateCode: "FRIENDTALK_DIRECT",
      phoneNumber: "01011112222",
      variables: { title: "2월 이벤트" },
      text: "친구톡 바로가기 안내",
      imageUrl: "https://img.example.com/event.png",
      buttons: [
        {
          name: "쿠폰받기",
          type: "WL",
          urlMobile: "https://m.example.com/coupon",
        },
      ],
      options: {
        subject: "이벤트",
      },
    });

    expect(result.status).toBe("SENT");
    expect(result.messageId).toBe("friend-standard-1");
    expect(result.metadata?.channel).toBe("friendtalk");

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("kakaoapi.aligo.in/akv10/friendtalk/send/");

    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.get("receiver_1")).toBe("01011112222");
    expect(form.get("message_1")).toBe("친구톡 바로가기 안내");
    expect(form.get("image_1")).toBe("https://img.example.com/event.png");
    expect(form.get("tpl_code")).toBeNull();

    fetchMock.mockRestore();
  });

  test("should fail ALIMTALK standard send when sender key is missing", async () => {
    const adapter = new AligoAdapter({
      apiKey: "test-api-key",
      userId: "test-user",
      sender: "01012345678",
    });

    const result = await adapter.sendStandard({
      channel: "ALIMTALK",
      templateCode: "WELCOME_001",
      phoneNumber: "01011112222",
      variables: { name: "홍길동" },
    });

    expect(result.status).toBe("FAILED");
    expect(result.error?.code).toBe("INVALID_REQUEST");
  });
});
