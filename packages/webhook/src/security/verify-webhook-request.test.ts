import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { createHmac } from "node:crypto";
import {
  type HttpClient,
  WebhookDispatcher,
} from "../services/webhook.dispatcher";
import { WebhookEventType } from "../types/webhook.types";
import {
  type VerifyWebhookRequestOptions,
  verifyWebhookRequest,
  WebhookVerificationError,
  type WebhookVerificationErrorCode,
} from "./verify-webhook-request";

const SECRET = "whsec_receiver";
const BODY = JSON.stringify({ id: "evt_1", type: "message.delivered" });
const SIGNED_AT = new Date("2026-03-01T00:00:00.000Z");

function toSeconds(date: Date): string {
  return Math.floor(date.getTime() / 1000).toString();
}

function sign(
  timestamp: string,
  body: string,
  secret = SECRET,
  algorithm: "sha256" | "sha1" = "sha256",
  prefix = "sha256=",
): string {
  const digest = createHmac(algorithm, secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `${prefix}${digest}`;
}

function signedHeaders(timestamp = toSeconds(SIGNED_AT)): Headers {
  return new Headers({
    "X-Webhook-Timestamp": timestamp,
    "X-Webhook-Signature": sign(timestamp, BODY),
  });
}

function failureCode(
  result: ReturnType<typeof verifyWebhookRequest>,
): WebhookVerificationErrorCode | undefined {
  return result.isFailure ? result.error.code : undefined;
}

describe("verifyWebhookRequest", () => {
  afterEach(() => {
    setSystemTime();
  });

  test("accepts a request the dispatcher signed", async () => {
    const sent: RequestInit[] = [];
    const client: HttpClient = {
      fetch: async (_url, options) => {
        sent.push(options);
        return new Response("ok");
      },
    };
    const dispatcher = new WebhookDispatcher(
      {
        maxRetries: 0,
        retryDelayMs: 1,
        timeoutMs: 500,
        enableSecurity: true,
        enabledEvents: [WebhookEventType.MESSAGE_DELIVERED],
        batchSize: 10,
        batchTimeoutMs: 50,
      },
      client,
    );

    await dispatcher.dispatch(
      {
        id: "evt_1",
        type: WebhookEventType.MESSAGE_DELIVERED,
        // An event that happened long ago still verifies: the dispatcher
        // signs with the time it sends.
        timestamp: new Date("2020-01-01T00:00:00.000Z"),
        data: { messageId: "msg_1" },
        metadata: {},
        version: "1.0",
      },
      {
        id: "endpoint_1",
        url: "https://example.com/webhook",
        active: true,
        status: "active",
        events: [WebhookEventType.MESSAGE_DELIVERED],
        secret: SECRET,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const request = sent[0];
    const result = verifyWebhookRequest(
      new Headers(request?.headers),
      String(request?.body),
      SECRET,
    );

    expect(result.isSuccess).toBe(true);
  });

  test("returns the signed time", () => {
    setSystemTime(new Date(SIGNED_AT.getTime() + 30_000));

    const result = verifyWebhookRequest(signedHeaders(), BODY, SECRET);

    expect(result.isSuccess && result.value.timestamp).toEqual(SIGNED_AT);
  });

  test("reports a missing signature or timestamp", () => {
    setSystemTime(SIGNED_AT);
    const timestamp = toSeconds(SIGNED_AT);

    const unsigned = verifyWebhookRequest(
      new Headers({ "X-Webhook-Timestamp": timestamp }),
      BODY,
      SECRET,
    );
    const undated = verifyWebhookRequest(
      new Headers({ "X-Webhook-Signature": sign(timestamp, BODY) }),
      BODY,
      SECRET,
    );

    expect(failureCode(unsigned)).toBe("MISSING_SIGNATURE");
    expect(failureCode(undated)).toBe("MISSING_TIMESTAMP");
    expect(unsigned.isFailure && unsigned.error).toBeInstanceOf(
      WebhookVerificationError,
    );
  });

  test("rejects a changed body, a changed timestamp, or another secret", () => {
    setSystemTime(SIGNED_AT);
    const headers = signedHeaders();
    const later = toSeconds(new Date(SIGNED_AT.getTime() + 1_000));
    const retimed = new Headers(headers);
    retimed.set("X-Webhook-Timestamp", later);

    expect(failureCode(verifyWebhookRequest(headers, `${BODY} `, SECRET))).toBe(
      "INVALID_SIGNATURE",
    );
    expect(failureCode(verifyWebhookRequest(retimed, BODY, SECRET))).toBe(
      "INVALID_SIGNATURE",
    );
    expect(
      failureCode(verifyWebhookRequest(headers, BODY, "whsec_other")),
    ).toBe("INVALID_SIGNATURE");
  });

  test.each([
    ["six minutes old", -6 * 60_000],
    ["six minutes ahead", 6 * 60_000],
  ])("rejects a signature %s by default", (_label, offsetMs) => {
    const signedAt = new Date(SIGNED_AT.getTime() + offsetMs);
    setSystemTime(SIGNED_AT);

    const result = verifyWebhookRequest(
      signedHeaders(toSeconds(signedAt)),
      BODY,
      SECRET,
    );

    expect(failureCode(result)).toBe("STALE_TIMESTAMP");
  });

  test("toleranceMs sets how far the signed time may be from now", () => {
    setSystemTime(new Date(SIGNED_AT.getTime() + 6 * 60_000));
    const headers = signedHeaders();

    expect(
      verifyWebhookRequest(headers, BODY, SECRET, { toleranceMs: 10 * 60_000 })
        .isSuccess,
    ).toBe(true);
    expect(
      failureCode(
        verifyWebhookRequest(headers, BODY, SECRET, { toleranceMs: 60_000 }),
      ),
    ).toBe("STALE_TIMESTAMP");
  });

  test("rejects a signed timestamp that is not whole seconds", () => {
    setSystemTime(SIGNED_AT);
    const timestamp = SIGNED_AT.toISOString();

    const result = verifyWebhookRequest(
      new Headers({
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Signature": sign(timestamp, BODY),
      }),
      BODY,
      SECRET,
    );

    expect(failureCode(result)).toBe("INVALID_TIMESTAMP");
  });

  test("reads header records in any case and byte bodies", () => {
    setSystemTime(SIGNED_AT);
    const timestamp = toSeconds(SIGNED_AT);
    // Node's IncomingHttpHeaders: lowercase names, string or string[] values.
    const nodeHeaders = {
      "x-webhook-timestamp": timestamp,
      "x-webhook-signature": [sign(timestamp, BODY)],
      "content-type": "application/json",
    };
    const bytes = new TextEncoder().encode(BODY);

    expect(verifyWebhookRequest(nodeHeaders, bytes, SECRET).isSuccess).toBe(
      true,
    );
    expect(
      verifyWebhookRequest(nodeHeaders, bytes.buffer, SECRET).isSuccess,
    ).toBe(true);
  });

  test("uses the sender's signature header, prefix, and algorithm", () => {
    setSystemTime(SIGNED_AT);
    const timestamp = toSeconds(SIGNED_AT);
    const options: VerifyWebhookRequestOptions = {
      algorithm: "sha1",
      signatureHeader: "X-Signature",
      signaturePrefix: "v1=",
    };
    const headers = new Headers({
      "X-Webhook-Timestamp": timestamp,
      "X-Signature": sign(timestamp, BODY, SECRET, "sha1", "v1="),
    });

    expect(verifyWebhookRequest(headers, BODY, SECRET, options).isSuccess).toBe(
      true,
    );
    expect(failureCode(verifyWebhookRequest(headers, BODY, SECRET))).toBe(
      "MISSING_SIGNATURE",
    );
  });

  test("throws for an empty secret or an invalid tolerance", () => {
    const headers = signedHeaders();

    expect(() => verifyWebhookRequest(headers, BODY, "")).toThrow(TypeError);
    expect(() =>
      verifyWebhookRequest(headers, BODY, SECRET, { toleranceMs: -1 }),
    ).toThrow(RangeError);
    expect(() =>
      verifyWebhookRequest(headers, BODY, SECRET, { toleranceMs: Number.NaN }),
    ).toThrow(RangeError);
  });
});
