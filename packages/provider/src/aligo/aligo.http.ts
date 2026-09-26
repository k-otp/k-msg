import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type ProviderRequestContext,
  type Result,
} from "@k-msg/core";
import {
  fetchWithProviderContext,
  toProviderTransportError,
} from "../shared/provider-transport";
import { isObjectRecord } from "../shared/type-guards";
import { normalizeAligoCode } from "./aligo.shared.helpers";

export async function requestAligo(params: {
  host: string;
  endpoint: string;
  data: Record<string, unknown>;
  providerId: string;
  context?: ProviderRequestContext;
}): Promise<Record<string, unknown>> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params.data)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  try {
    const response = await fetchWithProviderContext(
      params.context,
      `${params.host}${params.endpoint}`,
      {
        method: "POST",
        body: formData,
      },
      params.providerId,
    );

    if (!response.ok) {
      throw new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        `HTTP error! status: ${response.status}`,
        { providerId: params.providerId },
      );
    }

    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    throw toProviderTransportError(
      error,
      params.context?.signal,
      params.providerId,
    );
  }
}

// -99 is Aligo's catch-all Kakao failure (authentication, missing
// parameters, insufficient points); only its message says which one. The
// documented credential messages are "등록되지 않은 인증키 입니다." and
// "인증오류입니다.", so match those phrases rather than "인증" alone, which
// also appears in verification-number (인증번호) errors. Points is checked
// first, so a message naming both is treated as a balance failure.
const INSUFFICIENT_POINTS_KEYWORD = "포인트";
const AUTHENTICATION_KEYWORDS = ["인증키", "인증오류"];

function mapAligoKakaoErrorCode(
  code: number | undefined,
  providerMessage: string | undefined,
): KMsgErrorCode {
  if (code === -99) {
    if (providerMessage?.includes(INSUFFICIENT_POINTS_KEYWORD)) {
      return KMsgErrorCode.INSUFFICIENT_BALANCE;
    }
    if (
      AUTHENTICATION_KEYWORDS.some((keyword) =>
        providerMessage?.includes(keyword),
      )
    ) {
      return KMsgErrorCode.AUTHENTICATION_FAILED;
    }
    // Stay non-retryable when the cause is unknown, as before.
    return KMsgErrorCode.INVALID_REQUEST;
  }
  if (code === -101) return KMsgErrorCode.AUTHENTICATION_FAILED;
  if (code === 509) return KMsgErrorCode.INVALID_REQUEST;
  return KMsgErrorCode.PROVIDER_ERROR;
}

export function ensureAligoKakaoOk(params: {
  providerId: string;
  response: unknown;
  fallbackMessage: string;
}): Result<void, KMsgError> {
  const { providerId, response: raw, fallbackMessage } = params;
  const response = isObjectRecord(raw) ? raw : {};
  const rawCode = response.code;
  const code = normalizeAligoCode(rawCode);
  if (code === 0) return ok(undefined);

  const providerMessage =
    typeof response.message === "string" && response.message.length > 0
      ? response.message
      : undefined;
  const message = providerMessage ?? fallbackMessage;
  const mapped = mapAligoKakaoErrorCode(code, providerMessage);
  return fail(
    new KMsgError(mapped, message, {
      providerId,
      originalCode: rawCode,
      raw,
    }),
  );
}
