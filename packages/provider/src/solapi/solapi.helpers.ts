import {
  type DeliveryStatus,
  KMsgError,
  KMsgErrorCode,
  type MessageBinaryInput,
  type MessageButton,
  type MessageVariables,
  type SendOptions,
} from "@k-msg/core";
import { isObjectRecord } from "../shared/type-guards";
import type {
  SolapiKakaoButton,
  SolapiMessageType,
} from "./solapi.internal.types";

export function mapSolapiStatusCode(statusCode?: string): DeliveryStatus {
  if (!statusCode) return "UNKNOWN";
  if (statusCode === "2000") return "PENDING";
  if (statusCode === "3000") return "SENT";
  if (statusCode === "4000") return "DELIVERED";
  if (/^[123]\\d{3}$/.test(statusCode)) return "FAILED";
  return "UNKNOWN";
}

export function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\\D/g, "")}`;
  }
  return trimmed.replace(/\\D/g, "");
}

export function stringifyVariables(
  variables: MessageVariables | undefined,
): Record<string, string> {
  const output: Record<string, string> = {};
  if (!variables) return output;

  for (const [key, value] of Object.entries(variables)) {
    if (value === undefined) continue;
    output[key] =
      value === null
        ? ""
        : value instanceof Date
          ? value.toISOString()
          : typeof value === "string"
            ? value
            : String(value);
  }

  return output;
}

export function toKakaoButtons(
  buttons: MessageButton[] | undefined,
): SolapiKakaoButton[] | undefined {
  if (!Array.isArray(buttons) || buttons.length === 0) return undefined;
  const out: SolapiKakaoButton[] = [];

  for (const button of buttons) {
    if (!button) continue;
    if (button.type !== "WL") continue;
    if (!button.name || !button.urlMobile) continue;
    out.push({
      buttonName: button.name,
      buttonType: "WL",
      linkMo: button.urlMobile,
      linkPc: button.urlPc,
    });
  }

  return out.length > 0 ? out : undefined;
}

export function resolveImageRef(options: {
  imageUrl?: string;
  media?: { image?: MessageBinaryInput };
  providerId: string;
}) {
  const imageUrl =
    typeof options.imageUrl === "string" && options.imageUrl.trim().length > 0
      ? options.imageUrl.trim()
      : undefined;
  if (imageUrl) return imageUrl;

  const image = options.media?.image;
  if (!image) return undefined;

  if ("ref" in image) {
    const ref = image.ref.trim();
    return ref.length > 0 ? ref : undefined;
  }

  throw new KMsgError(
    KMsgErrorCode.INVALID_REQUEST,
    "SOLAPI image upload requires `options.imageUrl` or `options.media.image.ref` (url/path).",
    { providerId: options.providerId },
  );
}

export function extractFileId(upload: unknown): string | undefined {
  return isObjectRecord(upload) && typeof upload.fileId === "string"
    ? upload.fileId
    : undefined;
}

export function toSolapiMessageType(options: SendOptions): SolapiMessageType {
  switch (options.type) {
    case "ALIMTALK":
      return "ATA";
    case "FRIENDTALK":
      return (typeof options.imageUrl === "string" &&
        options.imageUrl.trim().length > 0) ||
        Boolean(options.media?.image)
        ? "CTI"
        : "CTA";
    default:
      return options.type as unknown as SolapiMessageType;
  }
}
