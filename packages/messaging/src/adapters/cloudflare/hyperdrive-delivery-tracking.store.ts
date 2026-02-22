import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../../delivery-tracking/store.interface";
import {
  isTerminalDeliveryStatus,
  type TrackingRecord,
} from "../../delivery-tracking/types";
import {
  type DeliveryTrackingColumnKey,
  type DeliveryTrackingSchemaOptions,
  type DeliveryTrackingSchemaSpec,
  getDeliveryTrackingColumnKeys,
  getDeliveryTrackingSchemaSpec,
} from "./delivery-tracking-schema";
import type { CloudflareSqlClient, SqlDialect } from "./sql-client";
import { initializeCloudflareSqlSchema } from "./sql-schema";

const TERMINAL_STATUSES = [
  "DELIVERED",
  "FAILED",
  "CANCELLED",
  "UNKNOWN",
] as const;

type TrackingRow = Record<string, unknown>;

type WhereSql = {
  sql: string;
  params: unknown[];
};

function safeJsonParse<T>(value: unknown): T | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return new Date(asNumber);
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) return asDate;
  }
  return undefined;
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export type HyperdriveDeliveryTrackingStoreOptions =
  | string
  | DeliveryTrackingSchemaOptions;

export class HyperdriveDeliveryTrackingStore implements DeliveryTrackingStore {
  private initPromise: Promise<void> | undefined;
  private readonly schema: DeliveryTrackingSchemaSpec;

  constructor(
    private readonly client: CloudflareSqlClient,
    options: HyperdriveDeliveryTrackingStoreOptions = {},
  ) {
    const resolved =
      typeof options === "string" ? { tableName: options } : options;
    this.schema = getDeliveryTrackingSchemaSpec(resolved);
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = initializeCloudflareSqlSchema(this.client, {
      target: "tracking",
      trackingTableName: this.schema.tableName,
      trackingColumnMap: this.schema.columnMap,
      trackingTypeStrategy: this.schema.typeStrategy,
      trackingStoreRaw: this.schema.storeRaw,
    }).catch((error) => {
      this.initPromise = undefined;
      throw error;
    });

    return this.initPromise;
  }

  async upsert(record: TrackingRecord): Promise<void> {
    await this.init();

    const keys = getDeliveryTrackingColumnKeys(this.schema.storeRaw);
    const values = keys.map((key) => this.recordValueForKey(record, key));

    const colSql = keys
      .map((key) => this.quoteIdentifier(this.columnName(key)))
      .join(", ");
    const valueSql = this.placeholders(keys.length).join(", ");

    if (this.client.dialect === "mysql") {
      const updates = keys
        .filter((key) => key !== "messageId")
        .map((key) => {
          const qColumn = this.quoteIdentifier(this.columnName(key));
          return `${qColumn} = VALUES(${qColumn})`;
        })
        .join(", ");

      await this.client.query(
        `INSERT INTO ${this.tableRef()} (${colSql}) VALUES (${valueSql}) ON DUPLICATE KEY UPDATE ${updates}`,
        values,
      );
      return;
    }

    const updates = keys
      .filter((key) => key !== "messageId")
      .map((key) => {
        const qColumn = this.quoteIdentifier(this.columnName(key));
        return `${qColumn} = excluded.${qColumn}`;
      })
      .join(", ");

    await this.client.query(
      `INSERT INTO ${this.tableRef()} (${colSql}) VALUES (${valueSql}) ON CONFLICT (${this.quoteIdentifier(this.columnName("messageId"))}) DO UPDATE SET ${updates}`,
      values,
    );
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    await this.init();

    const messageIdPlaceholder = this.placeholder(1);
    const { rows } = await this.client.query<TrackingRow>(
      `SELECT * FROM ${this.tableRef()} WHERE ${this.quoteIdentifier(this.columnName("messageId"))} = ${messageIdPlaceholder} LIMIT 1`,
      [messageId],
    );
    const row = rows[0];
    return row ? this.rowToRecord(row) : undefined;
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    await this.init();

    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    const statusPlaceholders = this.placeholders(TERMINAL_STATUSES.length, 1);
    const nowPlaceholder = this.placeholder(TERMINAL_STATUSES.length + 1);
    const limitPlaceholder = this.placeholder(TERMINAL_STATUSES.length + 2);

    const { rows } = await this.client.query<TrackingRow>(
      `SELECT * FROM ${this.tableRef()} WHERE ${this.quoteIdentifier(this.columnName("status"))} NOT IN (${statusPlaceholders.join(", ")}) AND ${this.quoteIdentifier(this.columnName("nextCheckAt"))} <= ${nowPlaceholder} ORDER BY ${this.quoteIdentifier(this.columnName("nextCheckAt"))} ASC LIMIT ${limitPlaceholder}`,
      [...TERMINAL_STATUSES, this.toDbTimestamp(now), safeLimit],
    );

    return rows.map((row) => this.rowToRecord(row));
  }

  async listRecords(
    options: DeliveryTrackingListOptions,
  ): Promise<TrackingRecord[]> {
    await this.init();

    const safeLimit = Number.isFinite(options.limit)
      ? Math.max(0, Math.floor(options.limit))
      : 0;
    if (safeLimit === 0) return [];
    const safeOffset = Number.isFinite(options.offset)
      ? Math.max(0, Math.floor(options.offset ?? 0))
      : 0;

    const where = this.buildWhere(options);
    const orderBy =
      options.orderBy === "statusUpdatedAt"
        ? this.columnName("statusUpdatedAt")
        : this.columnName("requestedAt");
    const direction = options.orderDirection === "asc" ? "ASC" : "DESC";

    const params = [...where.params, safeLimit, safeOffset];
    const limitPlaceholder = this.placeholder(where.params.length + 1);
    const offsetPlaceholder = this.placeholder(where.params.length + 2);

    const { rows } = await this.client.query<TrackingRow>(
      `SELECT * FROM ${this.tableRef()} ${where.sql} ORDER BY ${this.quoteIdentifier(orderBy)} ${direction} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      params,
    );

    return rows.map((row) => this.rowToRecord(row));
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    await this.init();

    const where = this.buildWhere(filter);
    const { rows } = await this.client.query<{ count?: number | string }>(
      `SELECT COUNT(1) as count FROM ${this.tableRef()} ${where.sql}`,
      where.params,
    );

    const count = rows[0]?.count;
    return toNumberValue(count, 0);
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    await this.init();

    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const fieldMap: Record<DeliveryTrackingCountByField, string> = {
      providerId: this.columnName("providerId"),
      type: this.columnName("type"),
      status: this.columnName("status"),
    };

    const groupColumns = fields.map((field) => fieldMap[field]);
    const selectColumns = groupColumns
      .map((column) => this.quoteIdentifier(column))
      .join(", ");

    const where = this.buildWhere(filter);

    const { rows } = await this.client.query<Record<string, unknown>>(
      `SELECT ${selectColumns}, COUNT(1) as count FROM ${this.tableRef()} ${where.sql} GROUP BY ${selectColumns}`,
      where.params,
    );

    return rows.map((row) => {
      const key: Record<string, string> = {};
      for (let index = 0; index < fields.length; index += 1) {
        const field = fields[index];
        const column = groupColumns[index];
        key[field] = toStringValue(row[column]);
      }

      return {
        key,
        count: toNumberValue(row.count, 0),
      };
    });
  }

  async patch(
    messageId: string,
    patch: Partial<TrackingRecord>,
  ): Promise<void> {
    await this.init();

    const updates: Array<{ key: DeliveryTrackingColumnKey; value: unknown }> =
      [];

    if (patch.providerId !== undefined) {
      updates.push({ key: "providerId", value: patch.providerId });
    }
    if (patch.providerMessageId !== undefined) {
      updates.push({
        key: "providerMessageId",
        value: patch.providerMessageId,
      });
    }
    if (patch.type !== undefined) {
      updates.push({ key: "type", value: patch.type });
    }
    if (patch.to !== undefined) {
      updates.push({ key: "to", value: patch.to });
    }
    if ("from" in patch) {
      updates.push({ key: "from", value: patch.from ?? null });
    }
    if (patch.status !== undefined) {
      updates.push({ key: "status", value: patch.status });
    }
    if ("providerStatusCode" in patch) {
      updates.push({
        key: "providerStatusCode",
        value: patch.providerStatusCode ?? null,
      });
    }
    if ("providerStatusMessage" in patch) {
      updates.push({
        key: "providerStatusMessage",
        value: patch.providerStatusMessage ?? null,
      });
    }
    if ("sentAt" in patch) {
      updates.push({
        key: "sentAt",
        value: this.toDbOptionalTimestamp(patch.sentAt),
      });
    }
    if ("deliveredAt" in patch) {
      updates.push({
        key: "deliveredAt",
        value: this.toDbOptionalTimestamp(patch.deliveredAt),
      });
    }
    if ("failedAt" in patch) {
      updates.push({
        key: "failedAt",
        value: this.toDbOptionalTimestamp(patch.failedAt),
      });
    }
    if (patch.requestedAt !== undefined) {
      updates.push({
        key: "requestedAt",
        value: this.toDbTimestamp(patch.requestedAt),
      });
    }
    if ("scheduledAt" in patch) {
      updates.push({
        key: "scheduledAt",
        value: this.toDbOptionalTimestamp(patch.scheduledAt),
      });
    }
    if (patch.statusUpdatedAt !== undefined) {
      updates.push({
        key: "statusUpdatedAt",
        value: this.toDbTimestamp(patch.statusUpdatedAt),
      });
    }
    if (patch.attemptCount !== undefined) {
      updates.push({ key: "attemptCount", value: patch.attemptCount });
    }
    if ("lastCheckedAt" in patch) {
      updates.push({
        key: "lastCheckedAt",
        value: this.toDbOptionalTimestamp(patch.lastCheckedAt),
      });
    }
    if (patch.nextCheckAt !== undefined) {
      updates.push({
        key: "nextCheckAt",
        value: this.toDbTimestamp(patch.nextCheckAt),
      });
    }
    if ("lastError" in patch) {
      updates.push({
        key: "lastError",
        value: patch.lastError ? JSON.stringify(patch.lastError) : null,
      });
    }
    if (this.schema.storeRaw && "raw" in patch) {
      updates.push({
        key: "raw",
        value: patch.raw !== undefined ? JSON.stringify(patch.raw) : null,
      });
    }
    if ("metadata" in patch) {
      updates.push({
        key: "metadata",
        value: patch.metadata ? JSON.stringify(patch.metadata) : null,
      });
    }

    if (updates.length === 0) return;

    const setSql = updates
      .map(
        (update, index) =>
          `${this.quoteIdentifier(this.columnName(update.key))} = ${this.placeholder(index + 1)}`,
      )
      .join(", ");

    const wherePlaceholder = this.placeholder(updates.length + 1);

    await this.client.query(
      `UPDATE ${this.tableRef()} SET ${setSql} WHERE ${this.quoteIdentifier(this.columnName("messageId"))} = ${wherePlaceholder}`,
      [...updates.map((update) => update.value), messageId],
    );
  }

  async close(): Promise<void> {
    await this.client.close?.();
  }

  private useNativeDateTimestamps(): boolean {
    return (
      this.schema.typeStrategy.timestamp === "date" &&
      this.client.dialect === "postgres"
    );
  }

  private toDbTimestamp(value: Date): number | Date {
    return this.useNativeDateTimestamps() ? value : value.getTime();
  }

  private toDbOptionalTimestamp(
    value: Date | null | undefined,
  ): number | Date | null {
    if (!value) return null;
    return this.toDbTimestamp(value);
  }

  private rowToRecord(row: TrackingRow): TrackingRecord {
    const columnValue = (key: DeliveryTrackingColumnKey): unknown =>
      row[this.columnName(key)];

    const requestedAt = toDate(columnValue("requestedAt")) ?? new Date();
    const statusUpdatedAt =
      toDate(columnValue("statusUpdatedAt")) ?? requestedAt;
    const nextCheckAt = toDate(columnValue("nextCheckAt")) ?? requestedAt;

    const record: TrackingRecord = {
      messageId: toStringValue(columnValue("messageId")),
      providerId: toStringValue(columnValue("providerId")),
      providerMessageId: toStringValue(columnValue("providerMessageId")),
      type: toStringValue(columnValue("type")) as TrackingRecord["type"],
      to: toStringValue(columnValue("to")),
      requestedAt,
      status: toStringValue(columnValue("status")) as TrackingRecord["status"],
      statusUpdatedAt,
      attemptCount: toNumberValue(columnValue("attemptCount"), 0),
      nextCheckAt,
    };

    const from = toStringValue(columnValue("from"));
    if (from.length > 0) record.from = from;

    const providerStatusCode = toStringValue(columnValue("providerStatusCode"));
    if (providerStatusCode.length > 0) {
      record.providerStatusCode = providerStatusCode;
    }

    const providerStatusMessage = toStringValue(
      columnValue("providerStatusMessage"),
    );
    if (providerStatusMessage.length > 0) {
      record.providerStatusMessage = providerStatusMessage;
    }

    const scheduledAt = toDate(columnValue("scheduledAt"));
    if (scheduledAt) record.scheduledAt = scheduledAt;

    const sentAt = toDate(columnValue("sentAt"));
    if (sentAt) record.sentAt = sentAt;

    const deliveredAt = toDate(columnValue("deliveredAt"));
    if (deliveredAt) record.deliveredAt = deliveredAt;

    const failedAt = toDate(columnValue("failedAt"));
    if (failedAt) record.failedAt = failedAt;

    const lastCheckedAt = toDate(columnValue("lastCheckedAt"));
    if (lastCheckedAt) record.lastCheckedAt = lastCheckedAt;

    const lastError = safeJsonParse<TrackingRecord["lastError"]>(
      columnValue("lastError"),
    );
    if (lastError) record.lastError = lastError;

    if (this.schema.storeRaw) {
      const rawValue = columnValue("raw");
      if (rawValue !== null && rawValue !== undefined) {
        record.raw = safeJsonParse(rawValue) ?? rawValue;
      }
    }

    const metadata = safeJsonParse<Record<string, unknown>>(
      columnValue("metadata"),
    );
    if (metadata) record.metadata = metadata;

    return record;
  }

  private tableRef(): string {
    return this.quoteIdentifier(this.schema.tableName);
  }

  private columnName(key: DeliveryTrackingColumnKey): string {
    return this.schema.columnMap[key];
  }

  private quoteIdentifier(identifier: string): string {
    if (this.client.dialect === "mysql") {
      return `\`${identifier.replace(/`/g, "``")}\``;
    }
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private placeholder(index: number): string {
    return this.client.dialect === "postgres" ? `$${index}` : "?";
  }

  private placeholders(count: number, startIndex = 1): string[] {
    const values: string[] = [];
    for (let index = 0; index < count; index += 1) {
      values.push(this.placeholder(startIndex + index));
    }
    return values;
  }

  private recordValueForKey(
    record: TrackingRecord,
    key: DeliveryTrackingColumnKey,
  ): unknown {
    switch (key) {
      case "messageId":
        return record.messageId;
      case "providerId":
        return record.providerId;
      case "providerMessageId":
        return record.providerMessageId ?? "";
      case "type":
        return record.type;
      case "to":
        return record.to;
      case "from":
        return record.from ?? null;
      case "status":
        return record.status;
      case "providerStatusCode":
        return record.providerStatusCode ?? null;
      case "providerStatusMessage":
        return record.providerStatusMessage ?? null;
      case "sentAt":
        return this.toDbOptionalTimestamp(record.sentAt);
      case "deliveredAt":
        return this.toDbOptionalTimestamp(record.deliveredAt);
      case "failedAt":
        return this.toDbOptionalTimestamp(record.failedAt);
      case "requestedAt":
        return this.toDbTimestamp(record.requestedAt);
      case "scheduledAt":
        return this.toDbOptionalTimestamp(record.scheduledAt);
      case "statusUpdatedAt":
        return this.toDbTimestamp(record.statusUpdatedAt);
      case "attemptCount":
        return record.attemptCount;
      case "lastCheckedAt":
        return this.toDbOptionalTimestamp(record.lastCheckedAt);
      case "nextCheckAt":
        return this.toDbTimestamp(record.nextCheckAt);
      case "lastError":
        return record.lastError ? JSON.stringify(record.lastError) : null;
      case "raw":
        return record.raw !== undefined ? JSON.stringify(record.raw) : null;
      case "metadata":
        return record.metadata ? JSON.stringify(record.metadata) : null;
      default:
        return null;
    }
  }

  private buildWhere(filter: DeliveryTrackingRecordFilter): WhereSql {
    const clauses: string[] = [];
    const params: unknown[] = [];

    const addEquals = <T>(column: string, value: T | T[] | undefined): void => {
      const values = toArray(value)?.filter(
        (item) => item !== undefined && item !== null,
      );
      if (!values || values.length === 0) return;

      if (values.length === 1) {
        clauses.push(
          `${this.quoteIdentifier(column)} = ${this.placeholder(params.length + 1)}`,
        );
        params.push(values[0]);
        return;
      }

      const placeholders = this.placeholders(values.length, params.length + 1);
      clauses.push(
        `${this.quoteIdentifier(column)} IN (${placeholders.join(", ")})`,
      );
      params.push(...values);
    };

    addEquals(this.columnName("messageId"), filter.messageId);
    addEquals(this.columnName("providerId"), filter.providerId);
    addEquals(this.columnName("providerMessageId"), filter.providerMessageId);
    addEquals(this.columnName("type"), filter.type);
    addEquals(this.columnName("status"), filter.status);
    addEquals(this.columnName("to"), filter.to);
    addEquals(this.columnName("from"), filter.from);

    if (filter.requestedAtFrom) {
      clauses.push(
        `${this.quoteIdentifier(this.columnName("requestedAt"))} >= ${this.placeholder(params.length + 1)}`,
      );
      params.push(this.toDbTimestamp(filter.requestedAtFrom));
    }

    if (filter.requestedAtTo) {
      clauses.push(
        `${this.quoteIdentifier(this.columnName("requestedAt"))} <= ${this.placeholder(params.length + 1)}`,
      );
      params.push(this.toDbTimestamp(filter.requestedAtTo));
    }

    if (filter.statusUpdatedAtFrom) {
      clauses.push(
        `${this.quoteIdentifier(this.columnName("statusUpdatedAt"))} >= ${this.placeholder(params.length + 1)}`,
      );
      params.push(this.toDbTimestamp(filter.statusUpdatedAtFrom));
    }

    if (filter.statusUpdatedAtTo) {
      clauses.push(
        `${this.quoteIdentifier(this.columnName("statusUpdatedAt"))} <= ${this.placeholder(params.length + 1)}`,
      );
      params.push(this.toDbTimestamp(filter.statusUpdatedAtTo));
    }

    return {
      sql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
  }
}

export function inferSqlDialect(value: unknown): SqlDialect {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    normalized === "postgres" ||
    normalized === "mysql" ||
    normalized === "sqlite"
  ) {
    return normalized;
  }
  return "postgres";
}

export function normalizeTrackingRecord(
  record: TrackingRecord,
): TrackingRecord {
  const next: TrackingRecord = {
    ...record,
    requestedAt: new Date(record.requestedAt),
    statusUpdatedAt: new Date(record.statusUpdatedAt),
    nextCheckAt: new Date(record.nextCheckAt),
  };

  if (record.scheduledAt) next.scheduledAt = new Date(record.scheduledAt);
  if (record.sentAt) next.sentAt = new Date(record.sentAt);
  if (record.deliveredAt) next.deliveredAt = new Date(record.deliveredAt);
  if (record.failedAt) next.failedAt = new Date(record.failedAt);
  if (record.lastCheckedAt) next.lastCheckedAt = new Date(record.lastCheckedAt);
  if (record.lastError) next.lastError = { ...record.lastError };
  if (record.metadata) next.metadata = { ...record.metadata };

  if (isTerminalDeliveryStatus(next.status)) {
    next.nextCheckAt = new Date(next.statusUpdatedAt);
  }

  return next;
}
