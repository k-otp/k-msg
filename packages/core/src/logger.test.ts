import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { Logger, redactLogText } from "./logger";

describe("redactLogText", () => {
  test.each([
    ["sent to 010-1234-5678", "sent to 010********78"],
    ["sent to 01012345678.", "sent to 010******78."],
    ["수신번호 01012345678로 발송", "수신번호 010******78로 발송"],
    ["callback +82-10-1234-5678", "callback +82***********78"],
    ["office 02-123-4567", "office 02-******67"],
    ["voip 070-1234-5678", "voip 070********78"],
    ["safe number 0505-1234-5678", "safe number 050*********78"],
  ])("masks the phone number in %p", (text, expected) => {
    expect(redactLogText(text)).toBe(expected);
  });

  test.each([
    ["apiKey=abc123 rejected", "apiKey=[REDACTED] rejected"],
    ['{"secret":"s3cr3t","ok":true}', '{"secret":"[REDACTED]","ok":true}'],
    [
      "Authorization: Bearer eyJhbGciOi.x.y failed",
      "Authorization: Bearer [REDACTED] failed",
    ],
    ["password = hunter2", "password = [REDACTED]"],
    ["client_secret=abc123&x=1", "client_secret=[REDACTED]&x=1"],
    ['{"password":"one two"}', '{"password":"[REDACTED]"}'],
    [
      "connect postgres://app:hunter2@db:5432/sms failed",
      "connect postgres://app:[REDACTED]@db:5432/sms failed",
    ],
    ["redis://:p@ss@cache:6379", "redis://:[REDACTED]@cache:6379"],
  ])("redacts the credential in %p", (text, expected) => {
    expect(redactLogText(text)).toBe(expected);
  });

  test("leaves timestamps, ids, and prose alone", () => {
    const text =
      "token expired at 2026-09-26T09:00:00Z after 1234 ms (run 1790399550700, amount 25000, author: kim, see https://docs.example.com/a@b)";
    expect(redactLogText(text)).toBe(text);
  });
});

describe("Logger redaction", () => {
  let lines: string[] = [];
  const capture = () => {
    lines = [];
    const push = (line: unknown) => {
      lines.push(String(line));
    };
    return [
      spyOn(console, "log").mockImplementation(push),
      spyOn(console, "error").mockImplementation(push),
    ];
  };
  let spies: ReturnType<typeof capture> = [];

  afterEach(() => {
    for (const spy of spies) spy.mockRestore();
    spies = [];
  });

  test.each([true, false])(
    "keeps phone numbers and credentials out of messages and errors (json: %p)",
    (enableJson) => {
      spies = capture();
      const logger = new Logger({}, { enableJson, enableColors: false });
      const error = new Error("apiKey=abc123 rejected for 01012345678");

      logger.error(
        "send to 010-1234-5678 failed",
        { detail: "+821012345678" },
        error,
      );

      const output = lines.join("\n");
      expect(output).not.toContain("1234-5678");
      expect(output).not.toContain("12345678");
      expect(output).not.toContain("abc123");
      expect(output).toContain("[REDACTED]");
      expect(output).toContain("010");
    },
  );
  test("tolerates an error whose stack is null", () => {
    spies = capture();
    const logger = new Logger({}, { enableJson: true, enableColors: false });
    const error = Object.assign(new Error("boom"), { stack: null });

    expect(() =>
      logger.error("failed", {}, error as unknown as Error),
    ).not.toThrow();
    expect(lines.join("\n")).toContain("boom");
  });
});
