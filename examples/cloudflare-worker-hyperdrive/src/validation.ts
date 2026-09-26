import { ApiError } from "./http";

// 010, 011, 016, 017, 018 and 019 numbers once hyphens and spaces are removed.
const MOBILE_NUMBER_PATTERN = /^01[016789]\d{7,8}$/;
// The LMS limit. KMsg sends a text longer than 90 bytes as LMS, not SMS.
const MAX_TEXT_BYTES = 2_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** KMsg message ids are UUIDs. */
export function parseMessageId(value: string): string {
  if (!UUID_PATTERN.test(value)) throw invalid("The message id must be a UUID");
  return value;
}
