import {
  KMsgError,
  KMsgErrorCode,
  type MessageBinaryInput,
  type Template,
  type TemplateContext,
} from "@k-msg/core";
import {
  ButtonParser,
  interpolate,
  type TemplateButton,
} from "@k-msg/template";
import type { AligoConfig } from "./types/aligo";

export function resolveImageRef(options: {
  imageUrl?: string;
  media?: { image?: MessageBinaryInput };
  providerId: string;
}): string | undefined {
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
    "Aligo MMS/FriendTalk image requires `options.imageUrl` or `options.media.image.ref` (url/path).",
    { providerId: options.providerId },
  );
}

export function getAligoEndpoint(
  operation: "sendSMS" | "sendAlimTalk" | "sendFriendTalk",
  config: AligoConfig,
): string {
  switch (operation) {
    case "sendSMS":
      return "/send/";
    case "sendAlimTalk":
      return "/akv10/alimtalk/send/";
    case "sendFriendTalk":
      return config.friendtalkEndpoint || "/akv10/friendtalk/send/";
    default:
      return "/";
  }
}

export function formatAligoDate(date: Date): { date: string; time: string } {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    date: `${year}${month}${day}`,
    time: `${hours}${minutes}`,
  };
}

export function normalizeAligoKakaoCode(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export function resolveKakaoSenderKey(
  params: {
    providerId: string;
    config: AligoConfig;
  },
  ctx?: TemplateContext,
): string {
  const senderKey =
    (typeof ctx?.kakaoChannelSenderKey === "string" &&
    ctx.kakaoChannelSenderKey.trim().length > 0
      ? ctx.kakaoChannelSenderKey.trim()
      : params.config.senderKey) || "";
  if (!senderKey) {
    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "kakao channel senderKey is required (ctx.kakaoChannelSenderKey or config.senderKey)",
      { providerId: params.providerId },
    );
  }
  return senderKey;
}

export function toAligoTplButton(
  buttons: TemplateButton[] | undefined,
): string | undefined {
  if (!Array.isArray(buttons) || buttons.length === 0) return undefined;

  const serializedButtons = JSON.parse(
    ButtonParser.serializeButtons(buttons),
  ) as unknown[];
  return JSON.stringify({ button: serializedButtons });
}

export function mapAligoTemplateStatus(
  item: Record<string, unknown>,
): Template["status"] {
  const insp =
    typeof item.inspStatus === "string"
      ? item.inspStatus.trim().toUpperCase()
      : "";
  switch (insp) {
    case "APR":
      return "APPROVED";
    case "REJ":
      return "REJECTED";
    case "REQ":
    case "REG":
      return "INSPECTION";
    default:
      return "PENDING";
  }
}

export function parseAligoDateTime(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
    trimmed,
  );
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  const date = new Date(year, month - 1, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function resolveAligoTemplateMessage(
  variables: Record<string, unknown> | undefined,
  templateContent?: string,
): string {
  if (!variables) return "";
  const fullText = variables._full_text;
  if (fullText !== undefined && fullText !== null) return String(fullText);
  if (!templateContent) return Object.values(variables).map(String).join("\n");

  return interpolate(templateContent, variables);
}
