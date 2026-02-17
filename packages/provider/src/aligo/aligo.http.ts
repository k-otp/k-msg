import { fail, KMsgError, KMsgErrorCode, ok, type Result } from "@k-msg/core";
import { normalizeAligoKakaoCode } from "./aligo.helpers";

export async function requestAligo(params: {
  host: string;
  endpoint: string;
  data: Record<string, unknown>;
  providerId: string;
}): Promise<Record<string, unknown>> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params.data)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  const response = await fetch(`${params.host}${params.endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new KMsgError(
      KMsgErrorCode.NETWORK_ERROR,
      `HTTP error! status: ${response.status}`,
      { providerId: params.providerId },
    );
  }

  return (await response.json()) as Record<string, unknown>;
}

export function ensureAligoKakaoOk(params: {
  providerId: string;
  response: Record<string, unknown>;
  fallbackMessage: string;
}): Result<void, KMsgError> {
  const { providerId, response, fallbackMessage } = params;
  const rawCode = response.code;
  const code = normalizeAligoKakaoCode(rawCode);
  if (code === 0) return ok(undefined);

  const message =
    typeof response.message === "string" && response.message.length > 0
      ? response.message
      : fallbackMessage;
  const mapped =
    code === 509 || code === -99
      ? KMsgErrorCode.INVALID_REQUEST
      : KMsgErrorCode.PROVIDER_ERROR;
  return fail(
    new KMsgError(mapped, message, {
      providerId,
      originalCode: rawCode,
      raw: response,
    }),
  );
}
