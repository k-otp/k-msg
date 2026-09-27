import {
  type DeliveryStatusQuery,
  type DeliveryStatusResult,
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Result,
} from "@k-msg/core";
import {
  raceProviderAbort,
  toProviderAbortError,
} from "../shared/provider-transport";
import { isObjectRecord } from "../shared/type-guards";
import { mapSolapiError } from "./solapi.error";
import { mapSolapiStatusCode, parseDate } from "./solapi.helpers";
import type { SolapiSdkClient } from "./solapi.internal.types";

export async function getSolapiDeliveryStatus(params: {
  providerId: string;
  client: SolapiSdkClient;
  query: DeliveryStatusQuery;
  signal?: AbortSignal;
}): Promise<Result<DeliveryStatusResult | null, KMsgError>> {
  const { providerId, client, query, signal } = params;
  const providerMessageId = query.providerMessageId.trim();
  if (!providerMessageId) {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "providerMessageId is required",
        { providerId },
      ),
    );
  }

  try {
    // The SDK cannot take the signal, so observe it around the call.
    if (signal?.aborted) throw signal.reason;
    const response = await raceProviderAbort(
      client.getMessages({
        messageId: providerMessageId,
        limit: 1,
      }),
      signal,
    );

    const record = (isObjectRecord(response) ? response : {}) as Record<
      string,
      unknown
    >;
    const messageList = record.messageList;
    if (
      !messageList ||
      typeof messageList !== "object" ||
      Array.isArray(messageList)
    ) {
      return ok(null);
    }

    const recordList = messageList as Record<string, unknown>;
    const direct = recordList[providerMessageId];

    const values = Object.values(recordList);
    const found = values.find((v) => {
      if (!isObjectRecord(v)) return false;
      const mid = v.messageId;
      return typeof mid === "string" ? mid === providerMessageId : false;
    });

    const message = isObjectRecord(direct)
      ? direct
      : isObjectRecord(found)
        ? found
        : undefined;
    if (!message) return ok(null);

    const statusCode =
      typeof message.statusCode === "string" ? message.statusCode : undefined;
    const status = mapSolapiStatusCode(statusCode);

    const sentAt = parseDate(message.dateSent);
    const deliveredAt = parseDate(message.dateCompleted);

    return ok({
      providerId,
      providerMessageId,
      status,
      statusCode,
      statusMessage:
        typeof message.statusMessage === "string"
          ? message.statusMessage
          : undefined,
      sentAt,
      deliveredAt,
      raw: message,
    });
  } catch (error) {
    return fail(
      toProviderAbortError(error, signal, providerId) ??
        mapSolapiError(error, providerId),
    );
  }
}
