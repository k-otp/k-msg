import { describe, expect, test } from "bun:test";
import { ensureAligoKakaoOk } from "./aligo.http";

describe("ensureAligoKakaoOk", () => {
  test.each([
    [{ code: -99, message: "포인트가 부족합니다." }, "INSUFFICIENT_BALANCE"],
    [
      { code: -99, message: "등록되지 않은 인증키 입니다." },
      "AUTHENTICATION_FAILED",
    ],
    [{ code: -99, message: "인증오류입니다." }, "AUTHENTICATION_FAILED"],
    [
      { code: -99, message: "인증번호가 올바르지 않습니다." },
      "INVALID_REQUEST",
    ],
    [
      {
        code: -99,
        message: "계정 아이디(=userid) 파라메더 정보가 전달되지 않았습니다.",
      },
      "INVALID_REQUEST",
    ],
    [{ code: -99 }, "INVALID_REQUEST"],
    [{ code: "-101", message: "인증오류입니다." }, "AUTHENTICATION_FAILED"],
    [{ code: 509, message: "수정 가능 상태가 아닙니다." }, "INVALID_REQUEST"],
    [{ code: 999, message: "unknown" }, "PROVIDER_ERROR"],
    [{ message: "no code" }, "PROVIDER_ERROR"],
  ])("maps %o to %s", (response, expected) => {
    const result = ensureAligoKakaoOk({
      providerId: "aligo",
      response,
      fallbackMessage: "Aligo request failed",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(String(result.error.code)).toBe(expected);
    }
  });

  test("keeps the fallback message when Aligo sends none", () => {
    const result = ensureAligoKakaoOk({
      providerId: "aligo",
      response: { code: -99 },
      fallbackMessage: "Aligo request failed",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe("Aligo request failed");
    }
  });

  test("accepts code 0 as a number or a string", () => {
    for (const code of [0, "0"]) {
      const result = ensureAligoKakaoOk({
        providerId: "aligo",
        response: { code },
        fallbackMessage: "Aligo request failed",
      });
      expect(result.isSuccess).toBe(true);
    }
  });
});
