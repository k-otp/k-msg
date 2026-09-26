import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { Logger, redactLogText } from "./logger";

describe("redactLogText", () => {
  test.each([
    ["sent to 010-1234-5678", "sent to 010********78"],
    ["sent to 01012345678.", "sent to 010******78."],
    ["수신번호 01012345678로 발송", "수신번호 010******78로 발송"],
    ["callback +82-10-1234-5678", "callback +82***********78"],
    ["callback +82 (0)10-1234-5678", "callback +82**************78"],
    ["callback +82(0)10 1234 5678", "callback +82*************78"],
    ["office +82 (0)2-123-4567", "office +82************67"],
    ["office 02-123-4567", "office 02-******67"],
    ["voip 070-1234-5678", "voip 070********78"],
    ["safe number 0505-1234-5678", "safe number 050*********78"],
    ["call (010) 1234-5678", "call (01**********78"],
    ["toll-free 080-123-4567", "toll-free 080*******67"],
    ["center 1588-1234", "center 158****34"],
    ["(010-1234-5678)", "(010********78)"],
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
    ["https://user:pw@host?next=a@b", "https://user:[REDACTED]@host?next=a@b"],
    ["password='hunter2'", "password='[REDACTED]'"],
    ["{'password': 'one two'}", "{'password': '[REDACTED]'}"],
    ['truncated apiKey="abc', 'truncated apiKey="[REDACTED]"'],
    [
      String.raw`{"password":"abc\"SECRET_SUFFIX"}`,
      '{"password":"[REDACTED]"}',
    ],
    [
      'password="oops\nretrying, see "runbook"',
      'password="[REDACTED]"\nretrying, see "runbook"',
    ],
    [
      "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "AWS_SECRET_ACCESS_KEY=[REDACTED]",
    ],
    ['{"secretAccessKey":"abc"}', '{"secretAccessKey":"[REDACTED]"}'],
    ["SECRET_KEY: abc", "SECRET_KEY: [REDACTED]"],
    ["privateKey=abc", "privateKey=[REDACTED]"],
    ["x-api-key: abc", "x-api-key: [REDACTED]"],
    ["db_passphrase=abc", "db_passphrase=[REDACTED]"],
    ["credentials=abc", "credentials=[REDACTED]"],
    [
      String.raw`body={\"password\":\"SECRET_SUFFIX\"}`,
      String.raw`body={\"password\":\"[REDACTED]\"}`,
    ],
    [
      String.raw`{\"password\":\"a\\\"SECRET_SUFFIX\"}`,
      String.raw`{\"password\":\"[REDACTED]\"}`,
    ],
    [
      String.raw`error: {\"apiKey\":\"abc\",\"ok\":true}`,
      String.raw`error: {\"apiKey\":\"[REDACTED]\",\"ok\":true}`,
    ],
    [
      String.raw`{\'password\': \'abc\'}`,
      String.raw`{\'password\': \'[REDACTED]\'}`,
    ],
    ["config.password.value=TOPSECRET", "config.password.value=[REDACTED]"],
    ["client[secret]=TOPSECRET", "client[secret]=[REDACTED]"],
    ["settings.api.key=abc", "settings.api.key=[REDACTED]"],
    ["auth.private.key=abc", "auth.private.key=[REDACTED]"],
    ["config.auth.value=abc", "config.auth.value=[REDACTED]"],
    ["auth[0]=abc", "auth[0]=[REDACTED]"],
    ['config["password"]=TOPSECRET', 'config["password"]=[REDACTED]'],
    [
      "headers['authorization']: Bearer abc.def",
      "headers['authorization']: Bearer [REDACTED]",
    ],
    [
      "headers.authorization: Bearer abc.def",
      "headers.authorization: Bearer [REDACTED]",
    ],
    [
      String.raw`{\"password\":\"p@ss\w0rd\"}`,
      String.raw`{\"password\":\"[REDACTED]\"}`,
    ],
    [
      String.raw`{\"password\":\"p@ss\\w0rd\"}`,
      String.raw`{\"password\":\"[REDACTED]\"}`,
    ],
    [
      String.raw`{\'password\': \'p@ss\w0rd\'}`,
      String.raw`{\'password\': \'[REDACTED]\'}`,
    ],
    ["API key: TOPSECRET", "API key: [REDACTED]"],
    ["private key=TOPSECRET", "private key=[REDACTED]"],
    ["Private  Key = 'TOPSECRET'", "Private  Key = '[REDACTED]'"],
    ['{"API key":"TOPSECRET"}', '{"API key":"[REDACTED]"}'],
    [
      `password.${"x".repeat(65)}=TOPSECRET`,
      `password.${"x".repeat(65)}=[REDACTED]`,
    ],
    [
      `config.${"nested.".repeat(20)}password=TOPSECRET`,
      `config.${"nested.".repeat(20)}password=[REDACTED]`,
    ],
    [
      'error: "login failed: password=hunter2"',
      'error: "login failed: password=[REDACTED]"',
    ],
  ])("redacts the credential in %p", (text, expected) => {
    expect(redactLogText(text)).toBe(expected);
  });

  // Each took seconds when every word boundary rescanned the rest of its
  // run of key characters.
  test.each([
    ["path-like text", "config.".repeat(15_000)],
    ["a key that never reaches a separator", "token.".repeat(20_000)],
    ["repeated labels", "API ".repeat(25_000)],
    ["many short pairs", "a=b ".repeat(25_000)],
  ])("scans %s in linear time", (_, text) => {
    const started = performance.now();
    expect(redactLogText(text)).toBe(text);
    expect(performance.now() - started).toBeLessThan(1_000);
  });

  test("redacts a credential under a key of any length in linear time", () => {
    const key = `password.${"x".repeat(100_000)}`;
    const started = performance.now();
    expect(redactLogText(`${key}=TOPSECRET`)).toBe(`${key}=[REDACTED]`);
    expect(performance.now() - started).toBeLessThan(1_000);
  });

  test("leaves timestamps, ids, and prose alone", () => {
    const text =
      "token expired at 2026-09-26T09:00:00Z after 1234 ms (run 1790399550700, amount 25000, rate 1587.5000, author: kim, see https://docs.example.com/a@b and https://host:8443?next=a@b)";
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

  test.each([true, false])(
    "masks context values under snake, kebab, and spaced credential keys (json: %p)",
    (enableJson) => {
      spies = capture();
      const logger = new Logger({}, { enableJson, enableColors: false });

      logger.error("configured", {
        api_key: "sk_live_abcdef123456",
        "x-api-key": "key_abcdef123456",
        private_key: "pk_abcdef123456",
        "API key": "label_abcdef123456",
      });

      const output = lines.join("\n");
      expect(output).toContain("configured");
      expect(output).not.toContain("abcdef123456");
    },
  );
});
