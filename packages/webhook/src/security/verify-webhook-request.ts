import { fail, ok, type Result } from "@k-msg/core";
import type { WebhookConfig } from "../types/webhook.types";
import { SecurityManager, WEBHOOK_TIMESTAMP_HEADER } from "./security.manager";

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Request headers as a Fetch `Headers` object or a plain record, such as
 * Node's `IncomingHttpHeaders`. Record names are matched in any case.
 */
export type WebhookRequestHeaders =
  | Headers
  | Readonly<Record<string, string | readonly string[] | undefined>>;

/**
 * The raw request body, exactly as received. Parsing and re-serializing JSON
 * changes the bytes and breaks the signature.
 */
export type WebhookRequestBody = string | Uint8Array | ArrayBuffer;

/**
 * Options for {@link verifyWebhookRequest}. `algorithm`, `signatureHeader`,
 * and `signaturePrefix` must match the sender's `WebhookConfig`, so the same
 * object can be passed to both.
 */
export interface VerifyWebhookRequestOptions
  extends Pick<
    WebhookConfig,
    "algorithm" | "signatureHeader" | "signaturePrefix"
  > {
  /**
   * How far the signed time may be from the receiver's clock, in either
   * direction, in milliseconds. Defaults to 300000 (5 minutes).
   */
  toleranceMs?: number;
}

/**
 * Why {@link verifyWebhookRequest} rejected a request:
 *
 * - `MISSING_SIGNATURE`: the signature header is missing or empty.
 * - `MISSING_TIMESTAMP`: the `X-Webhook-Timestamp` header is missing or empty.
 * - `INVALID_SIGNATURE`: the signature does not match the body, timestamp,
 *   and secret.
 * - `INVALID_TIMESTAMP`: the signed timestamp is not a whole number of
 *   seconds.
 * - `STALE_TIMESTAMP`: the signed time is further from now than
 *   `toleranceMs`.
 */
export type WebhookVerificationErrorCode =
  | "MISSING_SIGNATURE"
  | "MISSING_TIMESTAMP"
  | "INVALID_SIGNATURE"
  | "INVALID_TIMESTAMP"
  | "STALE_TIMESTAMP";

export class WebhookVerificationError extends Error {
  readonly code: WebhookVerificationErrorCode;

  constructor(code: WebhookVerificationErrorCode, message: string) {
    super(message);
    this.name = "WebhookVerificationError";
    this.code = code;
  }
}

/** A request that {@link verifyWebhookRequest} accepted. */
export interface VerifiedWebhookRequest {
  /** When the sender signed the request, from `X-Webhook-Timestamp`. */
  timestamp: Date;
}

function readHeader(
  headers: WebhookRequestHeaders,
  name: string,
): string | undefined {
  if (typeof headers.get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }

  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(
    headers as Readonly<Record<string, string | readonly string[] | undefined>>,
  )) {
    if (key.toLowerCase() !== wanted) continue;
    return typeof value === "string" ? value : value?.[0];
  }
  return undefined;
}

function readBody(body: WebhookRequestBody): string {
  if (typeof body === "string") return body;
  // The sender signs a UTF-8 JSON string. Keep a leading BOM so the bytes
  // are checked as received.
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(body);
}

/**
 * Checks that a webhook request came from a k-msg sender that holds `secret`
 * and was signed recently.
 *
 * It verifies the signature header, an HMAC of `<X-Webhook-Timestamp>.<body>`,
 * in constant time, then checks that the signed time is within `toleranceMs`
 * of now. A request that passes can still be a repeat: webhooks are delivered
 * at least once, so skip event ids you have already processed.
 *
 * @param headers - The request headers.
 * @param body - The raw request body, before any JSON parsing.
 * @param secret - The endpoint's signing secret (or the sender's shared
 *   `secretKey`).
 * @returns The signed time, or a {@link WebhookVerificationError} whose
 *   `code` says which check failed.
 * @throws TypeError when `secret` is empty, and RangeError when
 *   `toleranceMs` is negative or NaN.
 *
 * @example
 * ```ts
 * const verified = verifyWebhookRequest(
 *   request.headers,
 *   await request.text(),
 *   env.WEBHOOK_SECRET,
 * );
 * if (verified.isFailure) {
 *   return new Response(verified.error.code, { status: 401 });
 * }
 * ```
 */
export function verifyWebhookRequest(
  headers: WebhookRequestHeaders,
  body: WebhookRequestBody,
  secret: string,
  options: VerifyWebhookRequestOptions = {},
): Result<VerifiedWebhookRequest, WebhookVerificationError> {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new TypeError("verifyWebhookRequest needs the signing secret");
  }
  const toleranceMs = options.toleranceMs ?? DEFAULT_TOLERANCE_MS;
  if (!(toleranceMs >= 0)) {
    throw new RangeError("toleranceMs must be a number of 0 or more");
  }

  const security = new SecurityManager(options);
  const signatureHeader = security.getConfig().header;

  const signature = readHeader(headers, signatureHeader);
  if (!signature) {
    return fail(
      new WebhookVerificationError(
        "MISSING_SIGNATURE",
        `The ${signatureHeader} header is missing`,
      ),
    );
  }
  const timestamp = readHeader(headers, WEBHOOK_TIMESTAMP_HEADER);
  if (!timestamp) {
    return fail(
      new WebhookVerificationError(
        "MISSING_TIMESTAMP",
        `The ${WEBHOOK_TIMESTAMP_HEADER} header is missing`,
      ),
    );
  }

  if (
    !security.verifySignatureWithTimestamp(
      readBody(body),
      timestamp,
      signature,
      secret,
    )
  ) {
    return fail(
      new WebhookVerificationError(
        "INVALID_SIGNATURE",
        "The signature does not match the body and timestamp",
      ),
    );
  }

  const signedAt = new Date(Number(timestamp) * 1000);
  if (!/^\d+$/.test(timestamp) || Number.isNaN(signedAt.getTime())) {
    return fail(
      new WebhookVerificationError(
        "INVALID_TIMESTAMP",
        `${WEBHOOK_TIMESTAMP_HEADER} is not a Unix time in seconds`,
      ),
    );
  }
  if (!(Math.abs(Date.now() - signedAt.getTime()) <= toleranceMs)) {
    return fail(
      new WebhookVerificationError(
        "STALE_TIMESTAMP",
        `${WEBHOOK_TIMESTAMP_HEADER} is more than ${toleranceMs} ms from the current time`,
      ),
    );
  }

  return ok({ timestamp: signedAt });
}
