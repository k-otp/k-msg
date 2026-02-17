import { KMsgError, KMsgErrorCode } from "@k-msg/core";
import {
  ApiKeyError,
  BadRequestError,
  ClientError,
  DefaultError,
  NetworkError,
  ServerError,
} from "solapi";
import { isObjectRecord } from "../shared/type-guards";

export function mapSolapiError(error: unknown, providerId: string): KMsgError {
  if (error instanceof KMsgError) return error;

  const record = isObjectRecord(error) ? error : {};

  if (error instanceof ApiKeyError) {
    return new KMsgError(KMsgErrorCode.AUTHENTICATION_FAILED, error.message, {
      providerId,
    });
  }

  if (error instanceof BadRequestError) {
    return new KMsgError(KMsgErrorCode.INVALID_REQUEST, error.message, {
      providerId,
      validationErrors: record.validationErrors,
    });
  }

  if (error instanceof NetworkError) {
    return new KMsgError(KMsgErrorCode.NETWORK_ERROR, error.message, {
      providerId,
      url: typeof record.url === "string" ? record.url : undefined,
      method: typeof record.method === "string" ? record.method : undefined,
      isRetryable:
        typeof record.isRetryable === "boolean" ? record.isRetryable : true,
    });
  }

  if (error instanceof ClientError) {
    const httpStatus =
      typeof record.httpStatus === "number" ? record.httpStatus : undefined;
    const isInvalidRequest =
      typeof httpStatus === "number" && httpStatus >= 400 && httpStatus < 500;

    return new KMsgError(
      isInvalidRequest
        ? KMsgErrorCode.INVALID_REQUEST
        : KMsgErrorCode.PROVIDER_ERROR,
      error.message,
      {
        providerId,
        httpStatus,
        errorCode: record.errorCode,
        errorMessage: record.errorMessage,
        url: record.url,
      },
    );
  }

  if (error instanceof ServerError) {
    return new KMsgError(KMsgErrorCode.PROVIDER_ERROR, error.message, {
      providerId,
      httpStatus:
        typeof record.httpStatus === "number" ? record.httpStatus : undefined,
    });
  }

  if (error instanceof DefaultError) {
    return new KMsgError(KMsgErrorCode.PROVIDER_ERROR, error.message, {
      providerId,
      errorCode: record.errorCode,
      errorMessage: record.errorMessage,
    });
  }

  return new KMsgError(
    KMsgErrorCode.UNKNOWN_ERROR,
    error instanceof Error ? error.message : String(error),
    { providerId },
  );
}
