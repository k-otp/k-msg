import { describe, expect, test } from "bun:test";
import {
  parseTemplateButtons,
  validateTemplatePayload,
} from "./template-input";

describe("template input validation", () => {
  test("parses and validates button JSON string", () => {
    const result = parseTemplateButtons(
      '[{"type":"WL","name":"웹","url_mobile":"https://example.com"}]',
    );

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value?.[0]).toEqual({
        type: "WL",
        name: "웹",
        linkMobile: "https://example.com",
      });
    }
  });

  test("fails when buttons is not an array", () => {
    const result = parseTemplateButtons('{"name":"bad"}');

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe("buttons must be a JSON array");
    }
  });

  test("fails when button schema is invalid", () => {
    const result = parseTemplateButtons([
      {
        type: "WL",
        name: "",
      },
    ]);

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe("buttons[0].name is required");
    }
  });

  test("validates create payload requirements", () => {
    const result = validateTemplatePayload(
      {
        name: "  OTP 템플릿  ",
        content: "인증번호 #{code}",
        buttons: [
          {
            type: "WL",
            name: "상세",
            linkMobile: "https://example.com",
          },
        ],
      },
      {
        requireName: true,
        requireContent: true,
      },
    );

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.name).toBe("OTP 템플릿");
      expect(result.value.buttons).toHaveLength(1);
    }
  });

  test("validates partial update payload", () => {
    const result = validateTemplatePayload(
      {
        content: "",
      },
      {
        requireName: false,
        requireContent: false,
      },
    );

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe("content must be a non-empty string");
    }
  });
});
