import { createD1DeliveryTrackingStore } from "@k-msg/messaging/adapters/cloudflare";
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
  type TrackingRecord,
} from "@k-msg/messaging/tracking";
import { WebhookEventType, type WebhookRuntimeService } from "@k-msg/webhook";
import { KMsg } from "k-msg";
import type { DeliveryStatus, MessageType } from "k-msg/core";
import type { Config } from "./env";
import { errorFields, log } from "./log";
import { createProvider } from "./providers";
import { createWebhookRuntime } from "./webhooks";

export interface Runtime {
  kmsg: KMsg;
  tracking: DeliveryTrackingService;
  webhooks: WebhookRuntimeService;
}

/**
 * Builds what one request or cron run needs from its bindings. These objects
 * hold per-run state such as cached init promises, so they are never kept in
 * module scope.
 */
export async function createRuntime(config: Config): Promise<Runtime> {
  const provider = await createProvider(config.provider);
  const webhooks = createWebhookRuntime(config);

  const tracking = new DeliveryTrackingService({
    providers: [provider],
    // The tables come from migrations/, so the store skips its own CREATE
    // TABLE and CREATE INDEX statements, four queries on every request.
    store: createD1DeliveryTrackingStore(config.db, {
      initializeSchema: false,
    }),
    onStatusChange: ({ record, previousStatus }) =>
      sendStatusWebhook(webhooks, record, previousStatus),
    onStatusChangeError: (error, { record }) => {
      log("error", "status webhook failed", {
        messageId: record.messageId,
        status: record.status,
        ...errorFields(error),
      });
    },
  });

  const kmsg = new KMsg({
    providers: [provider],
    hooks: createDeliveryTrackingHooks(tracking, {
      // The provider accepted the message, so the send still succeeds, but
      // it has no tracking record and no webhook will follow for it.
      onRecordError: (error, { result }) => {
        log("error", "could not record a sent message", {
          messageId: result.messageId,
          ...errorFields(error),
        });
      },
    }),
  });

  return { kmsg, tracking, webhooks };
}

/** A message's tracked state, as GET /messages/:id and webhooks show it. */
export interface MessageStatus {
  messageId: string;
  providerId: string;
  type: MessageType;
  status: DeliveryStatus;
  providerStatusCode: string | null;
  providerStatusMessage: string | null;
  requestedAt: string;
  statusUpdatedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
}

export function toMessageStatus(record: TrackingRecord): MessageStatus {
  return {
    messageId: record.messageId,
    providerId: record.providerId,
    type: record.type,
    status: record.status,
    providerStatusCode: record.providerStatusCode ?? null,
    providerStatusMessage: record.providerStatusMessage ?? null,
    requestedAt: record.requestedAt.toISOString(),
    statusUpdatedAt: record.statusUpdatedAt.toISOString(),
    sentAt: record.sentAt?.toISOString() ?? null,
    deliveredAt: record.deliveredAt?.toISOString() ?? null,
    failedAt: record.failedAt?.toISOString() ?? null,
  };
}

/**
 * Sends the webhook for a message's current status to every subscribed
 * endpoint. `previousStatus` is null for the first one, sent when the provider
 * accepts the message.
 */
export async function sendStatusWebhook(
  webhooks: WebhookRuntimeService,
  record: TrackingRecord,
  previousStatus: DeliveryStatus | null,
): Promise<void> {
  const type = eventTypeFor(record.status);
  if (type === undefined) {
    log("info", "status change has no webhook event type", {
      messageId: record.messageId,
      status: record.status,
      previousStatus,
    });
    return;
  }

  const deliveries = await webhooks.emitSync({
    // The same change always gets the same id, so receivers can drop the
    // duplicate that two overlapping cron runs could send.
    id: `${record.messageId}:${record.status}`,
    type,
    timestamp: new Date(),
    version: "1.0",
    data: { ...toMessageStatus(record), previousStatus },
    metadata: { messageId: record.messageId, providerId: record.providerId },
  });

  for (const delivery of deliveries) {
    if (delivery.status === "success") continue;
    // Not retried after this run; the row in kmsg_webhook_deliveries keeps
    // every attempt.
    log("warn", "webhook delivery failed", {
      deliveryId: delivery.id,
      endpointId: delivery.endpointId,
      eventId: delivery.eventId,
      status: delivery.status,
      attempts: delivery.attempts.length,
      httpStatus: delivery.attempts.at(-1)?.httpStatus ?? null,
    });
  }
}

function eventTypeFor(status: DeliveryStatus): WebhookEventType | undefined {
  switch (status) {
    case "SENT":
      return WebhookEventType.MESSAGE_SENT;
    case "DELIVERED":
      return WebhookEventType.MESSAGE_DELIVERED;
    case "FAILED":
      return WebhookEventType.MESSAGE_FAILED;
    // @k-msg/webhook has no event type for these; GET /messages/:id shows them.
    case "PENDING":
    case "CANCELLED":
    case "UNKNOWN":
      return undefined;
  }
}
