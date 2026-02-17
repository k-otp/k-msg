import { KMsgErrorCode, type Template } from "@k-msg/core";
import { utf8ToBase64 } from "../shared/base64";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";

export function getSendEndpoint(config: NormalizedIwinvConfig): string {
  const raw = config.sendEndpoint || "/api/v2/send/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function getAlimTalkHeaders(
  config: NormalizedIwinvConfig,
): Record<string, string> {
  const auth = utf8ToBase64(config.apiKey);
  const base: Record<string, string> = {
    AUTH: auth,
    "Content-Type": "application/json;charset=UTF-8",
  };

  if (
    typeof config.xForwardedFor === "string" &&
    config.xForwardedFor.length > 0
  ) {
    base["X-Forwarded-For"] = config.xForwardedFor;
  }

  if (config.extraHeaders && typeof config.extraHeaders === "object") {
    return { ...base, ...config.extraHeaders };
  }

  return base;
}

export function mapIwinvCodeToKMsgErrorCode(code: number): KMsgErrorCode {
  switch (code) {
    case 201:
    case 206:
    case 401:
    case 403:
      return KMsgErrorCode.AUTHENTICATION_FAILED;
    case 429:
      return KMsgErrorCode.RATE_LIMIT_EXCEEDED;
    case 519:
      return KMsgErrorCode.INSUFFICIENT_BALANCE;
    case 404:
    case 501:
      return KMsgErrorCode.TEMPLATE_NOT_FOUND;
    case 502:
    case 503:
    case 504:
    case 505:
    case 506:
    case 507:
    case 508:
    case 509:
    case 510:
    case 511:
    case 512:
    case 513:
    case 514:
    case 515:
    case 516:
    case 517:
    case 540:
      return KMsgErrorCode.INVALID_REQUEST;
    case 518:
      return KMsgErrorCode.PROVIDER_ERROR;
    default:
      if (code >= 500) return KMsgErrorCode.PROVIDER_ERROR;
      return KMsgErrorCode.INVALID_REQUEST;
  }
}

export function normalizeIwinvCode(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export function toIwinvTemplateStatus(
  value: string | undefined,
): "Y" | "I" | "R" | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  if (!normalized) return undefined;

  switch (normalized) {
    case "Y":
    case "APPROVED":
      return "Y";
    case "I":
    case "INSPECTION":
      return "I";
    case "R":
    case "REJECTED":
      return "R";
    case "PENDING":
      return "I";
    default:
      return undefined;
  }
}

export function mapIwinvTemplateStatus(value: unknown): Template["status"] {
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : "";
  switch (normalized) {
    case "Y":
      return "APPROVED";
    case "I":
      return "INSPECTION";
    case "R":
      return "REJECTED";
    default:
      return "PENDING";
  }
}
