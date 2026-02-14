export enum KMsgErrorCode {
  INVALID_REQUEST = "INVALID_REQUEST",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  NETWORK_SERVICE_UNAVAILABLE = "NETWORK_SERVICE_UNAVAILABLE",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class KMsgError extends Error {
  public readonly code: KMsgErrorCode;
  public readonly details?: Record<string, any>;

  constructor(
    code: KMsgErrorCode,
    message: string,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = "KMsgError";
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KMsgError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export const ErrorUtils = {
  isRetryable: (error: any): boolean => {
    if (error instanceof KMsgError) {
      return [
        KMsgErrorCode.NETWORK_ERROR,
        KMsgErrorCode.RATE_LIMIT_EXCEEDED,
        KMsgErrorCode.PROVIDER_ERROR,
      ].includes(error.code);
    }
    return false;
  },
};
