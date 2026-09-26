import { ApiError } from "./http";

// 010, 011, 016, 017, 018 and 019 numbers once hyphens and spaces are removed.
const MOBILE_NUMBER_PATTERN = /^01[016789]\d{7,8}$/;
// The LMS limit. KMsg sends a text longer than 90 bytes as LMS, not SMS.
const MAX_TEXT_BYTES = 2_000;
// Visible ASCII without spaces, such as a UUID.
const IDEMPOTENCY_KEY_PATTERN = /^[!-~]{1,255}$/;
// Job ids look like job_1790380800000_1a2b3c4d; this only bounds the input.
const JOB_ID_PATTERN = /^[\w-]{1,128}$/;

function invalid(message: string): ApiError {
  return new ApiError(400, "INVALID_INPUT", message);
}

export interface SendMessageInput {
  to: string;
  text: string;
}

/** `{"to":"010-1234-5678","text":"..."}` */
export function parseSendMessage(
  body: Record<string, unknown>,
): SendMessageInput {
  if ("from" in body) {
    throw invalid('"from" is not accepted; the sender is KMSG_SENDER_NUMBER');
  }
  const unknown = Object.keys(body).find(
    (key) => key !== "to" && key !== "text",
  );
  if (unknown !== undefined) {
    throw invalid(`Unknown field "${unknown}"; expected to, text`);
  }

  const { to, text } = body;
  if (typeof to !== "string") throw invalid('"to" must be a string');
  const recipient = to.replace(/[\s-]/g, "");
  if (!MOBILE_NUMBER_PATTERN.test(recipient)) {
    throw invalid('"to" must be a Korean mobile number such as 01012345678');
  }
  if (typeof text !== "string" || text.trim() === "") {
    throw invalid('"text" must be a non-empty string');
  }
  if (estimateBytes(text) > MAX_TEXT_BYTES) {
    throw invalid(
      `"text" must be at most ${MAX_TEXT_BYTES} bytes; non-ASCII characters count as 2`,
    );
  }
  return { to: recipient, text };
}

// The estimate KMsg uses to choose between SMS and LMS.
function estimateBytes(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    bytes += text.charCodeAt(index) <= 0x7f ? 1 : 2;
  }
  return bytes;
}

/**
 * The Idempotency-Key header is required: a client that retries after a
 * timeout sends the same key, and the queue answers with the job it already
 * has instead of queueing the message twice.
 */
export function parseIdempotencyKey(value: string | undefined): string {
  if (value === undefined) {
    throw new ApiError(
      400,
      "IDEMPOTENCY_KEY_REQUIRED",
      "Send an Idempotency-Key header, such as a UUID, and reuse it when you retry",
    );
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw invalid(
      "Idempotency-Key must be 1 to 255 visible ASCII characters without spaces",
    );
  }
  return value;
}

export function isPlausibleJobId(value: string): boolean {
  return JOB_ID_PATTERN.test(value);
}
