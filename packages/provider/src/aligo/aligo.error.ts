import { KMsgError, KMsgErrorCode } from "@k-msg/core";
import { isObjectRecord } from "../shared/type-guards";

export function mapAligoKakaoError(
  error: unknown,
  providerId: string,
): KMsgError {
  if (error instanceof KMsgError) return error;
  return new KMsgError(
    KMsgErrorCode.PROVIDER_ERROR,
    error instanceof Error ? error.message : String(error),
    { providerId },
  );
}

export function mapAligoError(error: unknown, providerId: string): KMsgError {
  if (error instanceof KMsgError) return error;

  const record = isObjectRecord(error) ? error : {};
  const resultCodeRaw = record.result_code;
  const resultCode =
    resultCodeRaw !== undefined && resultCodeRaw !== null
      ? String(resultCodeRaw)
      : "UNKNOWN";

  const message =
    typeof record.message === "string" && record.message.length > 0
      ? record.message
      : typeof record.msg === "string" && record.msg.length > 0
        ? record.msg
        : error instanceof Error
          ? error.message
          : "Unknown Aligo error";

  let code: KMsgErrorCode = KMsgErrorCode.PROVIDER_ERROR;

  switch (resultCode) {
    case "-100":
    case "-101":
      code = KMsgErrorCode.AUTHENTICATION_FAILED;
      break;
    case "-102":
    case "-201":
      code = KMsgErrorCode.INSUFFICIENT_BALANCE;
      break;
    case "-103":
    case "-105":
      code = KMsgErrorCode.INVALID_REQUEST;
      break;
    case "-501":
      code = KMsgErrorCode.TEMPLATE_NOT_FOUND;
      break;
    default:
      code = KMsgErrorCode.PROVIDER_ERROR;
  }

  return new KMsgError(code, `${message} (code: ${resultCode})`, {
    providerId,
    resultCode,
  });
}
