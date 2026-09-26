import type { WebhookEventType } from "@k-msg/webhook";
import { ApiError, isRecord } from "./http";
import { MESSAGE_EVENT_TYPES } from "./webhooks";

// 010, 011, 016, 017, 018 and 019 numbers once hyphens and spaces are removed.
const MOBILE_NUMBER_PATTERN = /^01[016789]\d{7,8}$/;
// The LMS limit. KMsg sends a text longer than 90 bytes as LMS, not SMS.
const MAX_TEXT_BYTES = 2_000;
const MAX_URL_LENGTH = 2_048;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalid(message: string): ApiError {
  return new ApiError(400, "INVALID_INPUT", message);
}

function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const unknown = Object.keys(body).find((key) => !allowed.includes(key));
  if (unknown !== undefined) {
    throw invalid(`Unknown field "${unknown}"; expected ${allowed.join(", ")}`);
  }
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
  rejectUnknownFields(body, ["to", "text"]);

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

export function parseMessageId(value: string): string {
  if (!UUID_PATTERN.test(value)) throw invalid("The message id must be a UUID");
  return value;
}

export interface EndpointRegistration {
  url: string;
  events: WebhookEventType[];
}

/** `{"url":"https://...","events":["message.delivered"]}`; events is optional. */
export function parseEndpointRegistration(
  body: Record<string, unknown>,
): EndpointRegistration {
  rejectUnknownFields(body, ["url", "events"]);

  const { url, events } = body;
  if (typeof url !== "string" || url === "" || url.length > MAX_URL_LENGTH) {
    throw invalid(
      `"url" must be a URL of at most ${MAX_URL_LENGTH} characters`,
    );
  }
  if (events === undefined) {
    return { url, events: [...MESSAGE_EVENT_TYPES] };
  }
  if (!Array.isArray(events) || events.length === 0) {
    throw invalid('"events" must be a non-empty array');
  }

  const selected: WebhookEventType[] = [];
  for (const value of events) {
    const type = MESSAGE_EVENT_TYPES.find((candidate) => candidate === value);
    if (type === undefined) {
      throw invalid(
        `"events" may only contain ${MESSAGE_EVENT_TYPES.join(", ")}`,
      );
    }
    if (!selected.includes(type)) selected.push(type);
  }
  return { url, events: selected };
}

export interface ReceivedEvent {
  id: string;
  type: string;
  messageId: string | null;
  status: string | null;
}

/** Reads the fields the sample receiver logs from a verified webhook body. */
export function parseReceivedEvent(body: string): ReceivedEvent {
  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    throw new ApiError(
      400,
      "INVALID_JSON",
      "The webhook body must be valid JSON",
    );
  }
  if (
    !isRecord(event) ||
    typeof event.id !== "string" ||
    typeof event.type !== "string"
  ) {
    throw invalid("The webhook body must be an event with an id and a type");
  }
  const data = isRecord(event.data) ? event.data : {};
  return {
    id: event.id,
    type: event.type,
    messageId: typeof data.messageId === "string" ? data.messageId : null,
    status: typeof data.status === "string" ? data.status : null,
  };
}
