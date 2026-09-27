import {
  type CloudflareSqlClient,
  createCloudflareSqlClient,
  HyperdriveDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";
import {
  createDeliveryTrackingHooks,
  type DeliveryStatusChange,
  DeliveryTrackingService,
  type TrackingRecord,
} from "@k-msg/messaging/tracking";
import { KMsg } from "k-msg";
import postgres from "postgres";
import type { Config } from "./env";
import { errorFields, log } from "./log";
import { createProvider, maskPhoneNumber } from "./providers";
import { TRACKING_SCHEMA } from "./tracking-schema";

export interface TrackingRuntime {
  kmsg: KMsg;
  tracking: DeliveryTrackingService;
  /** Ends the database connection; pass the promise to ctx.waitUntil(). */
  close(): Promise<void>;
}

/**
 * Builds what one request or cron run needs. Workers cannot share I/O
 * objects between requests, and Hyperdrive pools the real connections, so
 * each run opens its own postgres.js client and closes it when done.
 */
export async function openTrackingRuntime(
  config: Config,
): Promise<TrackingRuntime> {
  const provider = await createProvider(config.provider);
  const sql = postgres(config.hyperdrive.connectionString, {
    // Workers limit concurrent connections per request.
    max: 5,
    // The schema has no custom types; skip the lookup round trip.
    fetch_types: false,
  });

  const tracking = new DeliveryTrackingService({
    providers: [provider],
    // The schema comes from sql/schema.sql, so requests make no DDL round
    // trips and the database role needs no CREATE privilege.
    store: new HyperdriveDeliveryTrackingStore(postgresClient(sql), {
      ...TRACKING_SCHEMA,
      initializeSchema: false,
    }),
    polling: {
      // Aligo has no status lookup. Mark its messages UNKNOWN at the first
      // poll instead of polling them for a day.
      unsupportedProviderStrategy: "unknown",
    },
    onStatusChange: logStatusChange,
    onStatusChangeError: (error, { record }) => {
      log("error", "status change handler failed", {
        messageId: record.messageId,
        ...errorFields(error),
      });
    },
  });

  const kmsg = new KMsg({
    providers: [provider],
    hooks: createDeliveryTrackingHooks(tracking, {
      // The provider accepted the message, so the send still succeeds, but
      // it has no tracking record and the cron will never poll it.
      onRecordError: (error, { result }) => {
        log("error", "could not record a sent message", {
          messageId: result.messageId,
          ...errorFields(error),
        });
      },
    }),
  });

  return { kmsg, tracking, close: () => sql.end() };
}

/** Adapts postgres.js to the SQL client the Hyperdrive store expects. */
function postgresClient(sql: postgres.Sql): CloudflareSqlClient {
  return createCloudflareSqlClient({
    dialect: "postgres",
    query: async <T>(statement: string, params: readonly unknown[] = []) => {
      const rows = await sql.unsafe<T[]>(statement, params.map(toParameter));
      return { rows, rowCount: rows.count };
    },
  });
}

// The store binds strings, numbers, Dates and nulls. Anything else would be
// a bug, so fail instead of guessing a conversion.
function toParameter(value: unknown): postgres.SerializableParameter {
  if (value === undefined) return null;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }
  throw new TypeError(`Unsupported SQL parameter type: ${typeof value}`);
}

function logStatusChange({ record, previousStatus }: DeliveryStatusChange) {
  log("info", "delivery status changed", {
    messageId: record.messageId,
    providerId: record.providerId,
    previousStatus,
    status: record.status,
    to: maskPhoneNumber(record.to),
    providerStatusCode: record.providerStatusCode ?? null,
  });
}

/** A message's tracked state, as GET /messages/:messageId shows it. */
export interface MessageStatus {
  messageId: string;
  providerId: string;
  type: TrackingRecord["type"];
  status: TrackingRecord["status"];
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
