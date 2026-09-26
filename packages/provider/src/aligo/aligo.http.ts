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
// parameters, insufficient points); its message says which one.
function mapAligoKakaoErrorCode(
  code: number | undefined,
  message: string,
): KMsgErrorCode {
  if (code === -99) {
    if (message.includes("포인트")) return KMsgErrorCode.INSUFFICIENT_BALANCE;
    if (message.includes("인증")) return KMsgErrorCode.AUTHENTICATION_FAILED;
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

  const message =
    typeof response.message === "string" && response.message.length > 0
      ? response.message
      : fallbackMessage;
  const mapped = mapAligoKakaoErrorCode(code, message);
  return fail(
    new KMsgError(mapped, message, {
      providerId,
      originalCode: rawCode,
      raw,
    }),
  );
}
