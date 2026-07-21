import {
  KMsgError,
  KMsgErrorCode,
  type ProviderRequestContext,
} from "@k-msg/core";

function isTimeoutReason(reason: unknown): boolean {
  if (
    typeof DOMException !== "undefined" &&
    reason instanceof DOMException &&
    reason.name === "TimeoutError"
  ) {
    return true;
  }
  return (
    typeof reason === "object" &&
    reason !== null &&
    "code" in reason &&
    reason.code === KMsgErrorCode.NETWORK_TIMEOUT
  );
}

function isDefaultAbortReason(reason: unknown): boolean {
  return (
    typeof DOMException !== "undefined" &&
    reason instanceof DOMException &&
    reason.name === "AbortError"
  );
}

function abortReasonMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string" && reason.length > 0) return reason;
  return "Provider request aborted";
}

export function toProviderAbortError(
  error: unknown,
  signal: AbortSignal | undefined,
  providerId: string,
): KMsgError | undefined {
  if (!signal?.aborted) return undefined;
  if (error instanceof KMsgError) return error;

  const reason = signal.reason ?? error;
  const messageReason = isDefaultAbortReason(reason) ? error : reason;
  return new KMsgError(
    isTimeoutReason(reason)
      ? KMsgErrorCode.NETWORK_TIMEOUT
      : KMsgErrorCode.REQUEST_ABORTED,
    abortReasonMessage(messageReason),
    { providerId },
  );
}

export function toProviderNetworkError(
  error: unknown,
  providerId: string,
): KMsgError {
  if (error instanceof KMsgError) return error;

  return new KMsgError(
    KMsgErrorCode.NETWORK_ERROR,
    error instanceof Error ? error.message : String(error),
    { providerId },
  );
}

export function toProviderTransportError(
  error: unknown,
  signal: AbortSignal | undefined,
  providerId: string,
): KMsgError {
  return (
    toProviderAbortError(error, signal, providerId) ??
    toProviderNetworkError(error, providerId)
  );
}

export async function fetchWithProviderContext(
  context: ProviderRequestContext | undefined,
  input: RequestInfo | URL,
  init: Omit<RequestInit, "signal">,
  providerId: string,
): Promise<Response> {
  const fetchImpl = context?.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw toProviderNetworkError(
      new Error(
        "No fetch implementation is available; provide ProviderRequestContext.fetch or use a runtime with native fetch support",
      ),
      providerId,
    );
  }

  try {
    return await fetchImpl(input, { ...init, signal: context?.signal });
  } catch (error) {
    throw toProviderTransportError(error, context?.signal, providerId);
  }
}
