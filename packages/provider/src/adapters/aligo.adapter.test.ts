import { describe, expect, mock, spyOn, test } from "bun:test";
import { ok } from "@k-msg/core";
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
});
