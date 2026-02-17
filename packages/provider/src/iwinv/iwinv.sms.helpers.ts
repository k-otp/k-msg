import { type DeliveryStatus, KMsgErrorCode } from "@k-msg/core";
import { utf8ToBase64 } from "../shared/base64";
import { IWINV_SMS_BASE_URL } from "./iwinv.constants";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";

export function normalizePhoneNumber(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function resolveSmsBaseUrl(): string {
  return IWINV_SMS_BASE_URL;
}

export function buildSmsSecretHeader(config: NormalizedIwinvConfig): string {
  if (config.smsApiKey && config.smsAuthKey) {
    return utf8ToBase64(`${config.smsApiKey}&${config.smsAuthKey}`);
  }

  const legacyAuthKey = config.smsAuthKey || config.smsApiKey;
  if (!legacyAuthKey) return "";

  return utf8ToBase64(`${config.apiKey}&${legacyAuthKey}`);
}

export function canSendSmsV2(config: NormalizedIwinvConfig): boolean {
  const secret = buildSmsSecretHeader(config);
  return secret.length > 0;
}

export function normalizeCode(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

export function mapSmsResponseMessage(code: string, fallback: string): string {
  const knownMessages: Record<string, string> = {
    "0": "전송 성공",
    "1": "메시지가 전송되지 않았습니다.",
    "11": "운영 중인 서비스가 아닙니다.",
    "12": "요금제 충전 중입니다. 잠시 후 다시 시도해 보시기 바랍니다.",
    "13": "등록되지 않은 발신번호입니다.",
    "14": "인증 요청이 올바르지 않습니다.",
    "15": "등록하지 않은 IP에서는 발송되지 않습니다.",
    "21": "장문 메시지는 2000 Bytes까지만 입력이 가능합니다.",
    "22": "제목 입력 가능 문자가 올바르지 않습니다.",
    "23": "제목은 40 Byte까지만 입력이 가능합니다.",
    "31": "파일 업로드는 100KB까지 가능합니다.",
    "32": "허용되지 않는 파일 확장자입니다.",
    "33": "이미지 업로드에 실패했습니다.",
    "41": "수신 번호를 입력하여 주세요.",
    "42": "예약 전송 가능 시간이 아닙니다.",
    "43": "날짜와 시간 표현 형식에 맞춰 입력하여 주십시오.",
    "44": "최대 1000건 전송 가능합니다.",
    "50": "SMS 자동 충전 한도를 초과하였습니다.",
    "202": "SMS API 인증 실패 또는 SMS 서비스 권한이 없습니다.",
    "206": "등록하지 않은 IP에서는 발송되지 않습니다.",
  };
  return knownMessages[code] || fallback;
}

export function mapSmsErrorCode(
  code: string,
  responseOk: boolean,
): KMsgErrorCode {
  if (code === "14" || code === "15" || code === "202" || code === "206") {
    return KMsgErrorCode.AUTHENTICATION_FAILED;
  }
  if (code === "50") {
    return KMsgErrorCode.INSUFFICIENT_BALANCE;
  }
  if (
    code === "13" ||
    code === "21" ||
    code === "22" ||
    code === "23" ||
    code === "31" ||
    code === "32" ||
    code === "33" ||
    code === "41" ||
    code === "42" ||
    code === "43" ||
    code === "44"
  ) {
    return KMsgErrorCode.INVALID_REQUEST;
  }
  if (!responseOk) {
    return KMsgErrorCode.NETWORK_ERROR;
  }
  return KMsgErrorCode.PROVIDER_ERROR;
}

export function buildLmsTitle(text: string, subject?: string): string {
  if (subject && subject.trim().length > 0) return subject.trim();
  return text.slice(0, 20);
}

export function mapSmsV2HistoryStatus(
  statusCode?: string,
  statusMessage?: string,
): DeliveryStatus {
  if (statusCode === "06") return "DELIVERED";
  if (statusCode === "1000") return "DELIVERED";

  if (typeof statusMessage === "string") {
    if (statusMessage.includes("전송 성공")) return "DELIVERED";
    if (statusMessage.includes("대기") || statusMessage.includes("처리중")) {
      return "PENDING";
    }
  }

  if (statusCode === "00" || statusCode === "01") return "PENDING";
  if (!statusCode && !statusMessage) return "UNKNOWN";

  return "FAILED";
}
