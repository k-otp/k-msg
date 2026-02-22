import type { SqlDialect } from "./sql-client";

export const DEFAULT_DELIVERY_TRACKING_TABLE = "kmsg_delivery_tracking";

export type DeliveryTrackingColumnKey =
  | "messageId"
  | "providerId"
  | "providerMessageId"
  | "type"
  | "to"
  | "toEnc"
  | "toHash"
  | "toMasked"
  | "from"
  | "fromEnc"
  | "fromHash"
  | "fromMasked"
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
  | "metadata"
  | "metadataEnc"
  | "metadataHashes"
  | "cryptoKid"
  | "cryptoVersion"
  | "cryptoState"
  | "retentionClass"
  | "retentionBucketYm";

export interface DeliveryTrackingColumnMap {
  messageId: string;
  providerId: string;
  providerMessageId: string;
  type: string;
  to: string;
  toEnc: string;
  toHash: string;
  toMasked: string;
  from: string;
  fromEnc: string;
  fromHash: string;
  fromMasked: string;
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
  metadataEnc: string;
  metadataHashes: string;
  cryptoKid: string;
  cryptoVersion: string;
  cryptoState: string;
  retentionClass: string;
  retentionBucketYm: string;
}

export type DeliveryTrackingMessageIdType = "text" | "uuid" | "varchar";
export type DeliveryTrackingIdType = "text" | "varchar";
export type DeliveryTrackingShortTextType = "text" | "varchar";
export type DeliveryTrackingTimestampType = "bigint" | "integer" | "date";
export type DeliveryTrackingJsonType = "auto" | "text";

export interface DeliveryTrackingTypeStrategy {
  messageId?: DeliveryTrackingMessageIdType;
  id?: DeliveryTrackingIdType;
  shortText?: DeliveryTrackingShortTextType;
  timestamp?: DeliveryTrackingTimestampType;
  json?: DeliveryTrackingJsonType;
}

export type DeliveryTrackingFieldCryptoSchemaMode = "legacy" | "secure";

export interface DeliveryTrackingFieldCryptoSchemaOptions {
  enabled?: boolean;
  mode?: DeliveryTrackingFieldCryptoSchemaMode;
  compatPlainColumns?: boolean;
}

export interface ResolvedDeliveryTrackingFieldCryptoSchema {
  enabled: boolean;
  mode: DeliveryTrackingFieldCryptoSchemaMode;
  compatPlainColumns: boolean;
}

export interface DeliveryTrackingSchemaSpec {
  tableName: string;
  columnMap: DeliveryTrackingColumnMap;
  typeStrategy: ResolvedDeliveryTrackingTypeStrategy;
  storeRaw: boolean;
  fieldCrypto: ResolvedDeliveryTrackingFieldCryptoSchema;
  indexNames: {
    due: string;
    providerMessage: string;
    requestedAt: string;
    toHash: string;
    fromHash: string;
    retentionBucket: string;
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
  fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
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
  toEnc: "to_enc",
  toHash: "to_hash",
  toMasked: "to_masked",
  from: "from",
  fromEnc: "from_enc",
  fromHash: "from_hash",
  fromMasked: "from_masked",
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
  metadataEnc: "metadata_enc",
  metadataHashes: "metadata_hashes",
  cryptoKid: "crypto_kid",
  cryptoVersion: "crypto_version",
  cryptoState: "crypto_state",
  retentionClass: "retention_class",
  retentionBucketYm: "retention_bucket_ym",
};

const DEFAULT_TYPE_STRATEGY: ResolvedDeliveryTrackingTypeStrategy = {
  messageId: "text",
  id: "text",
  shortText: "varchar",
  timestamp: "bigint",
  json: "auto",
};

const DEFAULT_FIELD_CRYPTO_SCHEMA: ResolvedDeliveryTrackingFieldCryptoSchema = {
  enabled: false,
  mode: "legacy",
  compatPlainColumns: true,
};

const DEFAULT_INDEX_NAMES: DeliveryTrackingSchemaSpec["indexNames"] = {
  due: "idx_kmsg_delivery_due",
  providerMessage: "idx_kmsg_delivery_provider_msg",
  requestedAt: "idx_kmsg_delivery_requested_at",
  toHash: "idx_kmsg_delivery_to_hash",
  fromHash: "idx_kmsg_delivery_from_hash",
  retentionBucket: "idx_kmsg_delivery_retention_bucket",
};

const LEGACY_COLUMN_ORDER_WITH_RAW: readonly DeliveryTrackingColumnKey[] = [
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

const LEGACY_COLUMN_ORDER_WITHOUT_RAW: readonly DeliveryTrackingColumnKey[] =
  LEGACY_COLUMN_ORDER_WITH_RAW.filter((key) => key !== "raw");

const SECURE_COLUMN_ORDER_WITH_RAW: readonly DeliveryTrackingColumnKey[] = [
  "messageId",
  "providerId",
  "providerMessageId",
  "type",
  "toEnc",
  "toHash",
  "toMasked",
  "fromEnc",
  "fromHash",
  "fromMasked",
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
  "metadataEnc",
  "metadataHashes",
  "cryptoKid",
  "cryptoVersion",
  "cryptoState",
  "retentionClass",
  "retentionBucketYm",
  "raw",
];

const SECURE_COLUMN_ORDER_WITHOUT_RAW: readonly DeliveryTrackingColumnKey[] =
  SECURE_COLUMN_ORDER_WITH_RAW.filter((key) => key !== "raw");

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeString(value: unknown): string | undefined {
  const trimmed = normalizeNonEmptyString(value);
  return trimmed?.length ? trimmed : undefined;
}

function resolveFieldCryptoSchema(
  options: DeliveryTrackingFieldCryptoSchemaOptions | undefined,
): ResolvedDeliveryTrackingFieldCryptoSchema {
  if (!options || options.enabled !== true) {
    return { ...DEFAULT_FIELD_CRYPTO_SCHEMA };
  }

  const mode = options.mode === "legacy" ? "legacy" : "secure";
  return {
    enabled: true,
    mode,
    compatPlainColumns:
      typeof options.compatPlainColumns === "boolean"
        ? options.compatPlainColumns
        : false,
  };
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

  if (
    overrides.timestamp === "bigint" ||
    overrides.timestamp === "integer" ||
    overrides.timestamp === "date"
  ) {
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
  const next: DeliveryTrackingSchemaSpec["indexNames"] = {
    ...DEFAULT_INDEX_NAMES,
  };

  if (!overrides || typeof overrides !== "object") {
    return next;
  }

  const due = normalizeString(overrides.due);
  const providerMessage = normalizeString(overrides.providerMessage);
  const requestedAt = normalizeString(overrides.requestedAt);
  const toHash = normalizeString(overrides.toHash);
  const fromHash = normalizeString(overrides.fromHash);
  const retentionBucket = normalizeString(overrides.retentionBucket);

  if (due) next.due = due;
  if (providerMessage) next.providerMessage = providerMessage;
  if (requestedAt) next.requestedAt = requestedAt;
  if (toHash) next.toHash = toHash;
  if (fromHash) next.fromHash = fromHash;
  if (retentionBucket) next.retentionBucket = retentionBucket;

  return next;
}

export function getDeliveryTrackingColumnKeys(
  input: boolean | DeliveryTrackingSchemaSpec,
): readonly DeliveryTrackingColumnKey[] {
  if (typeof input === "boolean") {
    return input
      ? LEGACY_COLUMN_ORDER_WITH_RAW
      : LEGACY_COLUMN_ORDER_WITHOUT_RAW;
  }

  if (!input.fieldCrypto.enabled || input.fieldCrypto.mode === "legacy") {
    return input.storeRaw
      ? LEGACY_COLUMN_ORDER_WITH_RAW
      : LEGACY_COLUMN_ORDER_WITHOUT_RAW;
  }

  const base = input.storeRaw
    ? [...SECURE_COLUMN_ORDER_WITH_RAW]
    : [...SECURE_COLUMN_ORDER_WITHOUT_RAW];

  if (input.fieldCrypto.compatPlainColumns) {
    const insertionIndex = base.indexOf("status");
    base.splice(insertionIndex, 0, "to", "from");
    base.push("metadata");
  }

  return base;
}

export function getDeliveryTrackingSchemaSpec(
  options: DeliveryTrackingSchemaOptions = {},
): DeliveryTrackingSchemaSpec {
  const tableName =
    normalizeNonEmptyString(options.tableName) ??
    DEFAULT_DELIVERY_TRACKING_TABLE;
  const columnMap = resolveDeliveryTrackingColumnMap(options.columnMap);
  const typeStrategy = resolveDeliveryTrackingTypeStrategy(
    options.typeStrategy ?? options.trackingTypeStrategy,
  );
  const storeRaw = options.storeRaw === true;
  const fieldCrypto = resolveFieldCryptoSchema(options.fieldCryptoSchema);

  return {
    tableName,
    columnMap,
    typeStrategy,
    storeRaw,
    fieldCrypto,
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
    if (strategy.timestamp === "date") {
      if (dialect === "postgres") return "TIMESTAMPTZ";
      if (dialect === "mysql") return "BIGINT";
      return "INTEGER";
    }
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
