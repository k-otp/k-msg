import type { SqlDialect } from "./sql-client";

export const DEFAULT_DELIVERY_TRACKING_TABLE = "kmsg_delivery_tracking";

export type DeliveryTrackingColumnKey =
  | "messageId"
  | "providerId"
  | "providerMessageId"
  | "type"
  | "to"
  | "from"
  | "status"
  | "providerStatusCode"
  | "providerStatusMessage"
  | "sentAt"
  | "deliveredAt"
  | "failedAt"
  | "requestedAt"
  | "scheduledAt"
  | "statusUpdatedAt"
  | "attemptCount"
  | "lastCheckedAt"
  | "nextCheckAt"
  | "lastError"
  | "raw"
  | "metadata";

export interface DeliveryTrackingColumnMap {
  messageId: string;
  providerId: string;
  providerMessageId: string;
  type: string;
  to: string;
  from: string;
  status: string;
  providerStatusCode: string;
  providerStatusMessage: string;
  sentAt: string;
  deliveredAt: string;
  failedAt: string;
  requestedAt: string;
  scheduledAt: string;
  statusUpdatedAt: string;
  attemptCount: string;
  lastCheckedAt: string;
  nextCheckAt: string;
  lastError: string;
  raw: string;
  metadata: string;
}

export type DeliveryTrackingMessageIdType = "text" | "uuid" | "varchar";
export type DeliveryTrackingIdType = "text" | "varchar";
export type DeliveryTrackingShortTextType = "text" | "varchar";
export type DeliveryTrackingTimestampType = "bigint" | "integer";
export type DeliveryTrackingJsonType = "auto" | "text";

export interface DeliveryTrackingTypeStrategy {
  messageId?: DeliveryTrackingMessageIdType;
  id?: DeliveryTrackingIdType;
  shortText?: DeliveryTrackingShortTextType;
  timestamp?: DeliveryTrackingTimestampType;
  json?: DeliveryTrackingJsonType;
}

export interface DeliveryTrackingSchemaSpec {
  tableName: string;
  columnMap: DeliveryTrackingColumnMap;
  typeStrategy: ResolvedDeliveryTrackingTypeStrategy;
  storeRaw: boolean;
  indexNames: {
    due: string;
    providerMessage: string;
    requestedAt: string;
  };
}

export interface DeliveryTrackingSchemaOptions {
  tableName?: string;
  columnMap?: Partial<DeliveryTrackingColumnMap>;
  /**
   * New API: `typeStrategy`.
   * Legacy alias preserved for compatibility with `trackingTypeStrategy`.
   */
  trackingTypeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  typeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  indexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
  trackingIndexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
  storeRaw?: boolean;
}

export interface ResolvedDeliveryTrackingTypeStrategy {
  messageId: DeliveryTrackingMessageIdType;
  id: DeliveryTrackingIdType;
  shortText: DeliveryTrackingShortTextType;
  timestamp: DeliveryTrackingTimestampType;
  json: DeliveryTrackingJsonType;
}

const DEFAULT_COLUMN_MAP: DeliveryTrackingColumnMap = {
  messageId: "message_id",
  providerId: "provider_id",
  providerMessageId: "provider_message_id",
  type: "type",
  to: "to",
  from: "from",
  status: "status",
  providerStatusCode: "provider_status_code",
  providerStatusMessage: "provider_status_message",
  sentAt: "sent_at",
  deliveredAt: "delivered_at",
  failedAt: "failed_at",
  requestedAt: "requested_at",
  scheduledAt: "scheduled_at",
  statusUpdatedAt: "status_updated_at",
  attemptCount: "attempt_count",
  lastCheckedAt: "last_checked_at",
  nextCheckAt: "next_check_at",
  lastError: "last_error",
  raw: "raw",
  metadata: "metadata",
};

const DEFAULT_TYPE_STRATEGY: ResolvedDeliveryTrackingTypeStrategy = {
  messageId: "text",
  id: "text",
  shortText: "varchar",
  timestamp: "bigint",
  json: "auto",
};

const DEFAULT_INDEX_NAMES: DeliveryTrackingSchemaSpec["indexNames"] = {
  due: "idx_kmsg_delivery_due",
  providerMessage: "idx_kmsg_delivery_provider_msg",
  requestedAt: "idx_kmsg_delivery_requested_at",
};

export const COLUMN_ORDER_WITH_RAW: readonly DeliveryTrackingColumnKey[] = [
  "messageId",
  "providerId",
  "providerMessageId",
  "type",
  "to",
  "from",
  "status",
  "providerStatusCode",
  "providerStatusMessage",
  "sentAt",
  "deliveredAt",
  "failedAt",
  "requestedAt",
  "scheduledAt",
  "statusUpdatedAt",
  "attemptCount",
  "lastCheckedAt",
  "nextCheckAt",
  "lastError",
  "raw",
  "metadata",
];

const COLUMN_ORDER_WITHOUT_RAW: readonly DeliveryTrackingColumnKey[] =
  COLUMN_ORDER_WITH_RAW.filter((key) => key !== "raw");

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeString(value: unknown): string | undefined {
  const trimmed = normalizeNonEmptyString(value);
  return trimmed?.length ? trimmed : undefined;
}

export function resolveDeliveryTrackingColumnMap(
  overrides: Partial<DeliveryTrackingColumnMap> | undefined,
): DeliveryTrackingColumnMap {
  const next: DeliveryTrackingColumnMap = { ...DEFAULT_COLUMN_MAP };
  if (!overrides || typeof overrides !== "object") {
    return next;
  }

  for (const [rawKey, rawValue] of Object.entries(overrides)) {
    const key = rawKey as DeliveryTrackingColumnKey;
    if (!(key in next)) continue;
    const normalized = normalizeNonEmptyString(rawValue);
    if (!normalized) continue;
    next[key] = normalized;
  }

  return next;
}

function resolveDeliveryTrackingTypeStrategy(
  overrides: Partial<DeliveryTrackingTypeStrategy> | undefined,
): ResolvedDeliveryTrackingTypeStrategy {
  const strategy: ResolvedDeliveryTrackingTypeStrategy = {
    ...DEFAULT_TYPE_STRATEGY,
  };

  if (!overrides || typeof overrides !== "object") {
    return strategy;
  }

  if (
    overrides.messageId === "text" ||
    overrides.messageId === "uuid" ||
    overrides.messageId === "varchar"
  ) {
    strategy.messageId = overrides.messageId;
  }

  if (overrides.id === "text" || overrides.id === "varchar") {
    strategy.id = overrides.id;
  }

  if (overrides.shortText === "text" || overrides.shortText === "varchar") {
    strategy.shortText = overrides.shortText;
  }

  if (overrides.timestamp === "bigint" || overrides.timestamp === "integer") {
    strategy.timestamp = overrides.timestamp;
  }

  if (overrides.json === "auto" || overrides.json === "text") {
    strategy.json = overrides.json;
  }

  return strategy;
}

function resolveDeliveryTrackingIndexNames(
  overrides: Partial<DeliveryTrackingSchemaSpec["indexNames"]> | undefined,
): DeliveryTrackingSchemaSpec["indexNames"] {
  const next: DeliveryTrackingSchemaSpec["indexNames"] = { ...DEFAULT_INDEX_NAMES };

  if (!overrides || typeof overrides !== "object") {
    return next;
  }

  const due = normalizeString(overrides.due);
  const providerMessage = normalizeString(overrides.providerMessage);
  const requestedAt = normalizeString(overrides.requestedAt);

  if (due) next.due = due;
  if (providerMessage) next.providerMessage = providerMessage;
  if (requestedAt) next.requestedAt = requestedAt;

  return next;
}

export function getDeliveryTrackingColumnKeys(
  storeRaw: boolean,
): readonly DeliveryTrackingColumnKey[] {
  return storeRaw ? COLUMN_ORDER_WITH_RAW : COLUMN_ORDER_WITHOUT_RAW;
}

export function getDeliveryTrackingSchemaSpec(
  options: DeliveryTrackingSchemaOptions = {},
): DeliveryTrackingSchemaSpec {
  const tableName =
    normalizeNonEmptyString(options.tableName) ?? DEFAULT_DELIVERY_TRACKING_TABLE;
  const columnMap = resolveDeliveryTrackingColumnMap(options.columnMap);
  const typeStrategy = resolveDeliveryTrackingTypeStrategy(
    options.typeStrategy ?? options.trackingTypeStrategy,
  );
  const storeRaw = options.storeRaw === true;

  return {
    tableName,
    columnMap,
    typeStrategy,
    storeRaw,
    indexNames: resolveDeliveryTrackingIndexNames({
      ...(options.indexNames ?? {}),
      ...(options.trackingIndexNames ?? {}),
    }),
  };
}

export function resolveDeliveryTrackingSqlType(
  dialect: SqlDialect,
  kind:
    | "messageId"
    | "id"
    | "shortText"
    | "timestamp"
    | "attemptCount"
    | "json",
  strategy: ResolvedDeliveryTrackingTypeStrategy = DEFAULT_TYPE_STRATEGY,
): string {
  if (kind === "messageId") {
    if (strategy.messageId === "uuid") {
      if (dialect === "postgres") return "UUID";
      if (dialect === "mysql") return "VARCHAR(36)";
      return "TEXT";
    }
    if (strategy.messageId === "varchar") {
      if (dialect === "sqlite") return "TEXT";
      return "VARCHAR(255)";
    }
    return "TEXT";
  }

  if (kind === "id") {
    if (strategy.id === "varchar" && dialect !== "sqlite") {
      return "VARCHAR(255)";
    }
    return "TEXT";
  }

  if (kind === "shortText") {
    if (dialect === "sqlite") return "TEXT";
    return strategy.shortText === "text" ? "TEXT" : "VARCHAR(64)";
  }

  if (kind === "timestamp") {
    if (strategy.timestamp === "integer") return "INTEGER";
    if (dialect === "mysql") return "BIGINT";
    if (dialect === "sqlite") return "INTEGER";
    return "BIGINT";
  }

  if (kind === "attemptCount") {
    return "INTEGER";
  }

  if (strategy.json === "text") return "TEXT";
  if (dialect === "postgres") return "JSONB";
  if (dialect === "mysql") return "JSON";
  return "TEXT";
}
