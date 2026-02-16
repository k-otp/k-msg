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
import type { CloudflareSqlClient, SqlDialect } from "./sql-client";

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

export class HyperdriveDeliveryTrackingStore implements DeliveryTrackingStore {
  private initialized = false;

  constructor(
    private readonly client: CloudflareSqlClient,
    private readonly tableName = "kmsg_delivery_tracking",
  ) {}

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const table = this.tableRef();
    const q = (column: string) => this.quoteIdentifier(column);

    const idType = this.client.dialect === "mysql" ? "VARCHAR(255)" : "TEXT";
    const shortType = this.client.dialect === "mysql" ? "VARCHAR(64)" : "TEXT";
    const jsonType = this.client.dialect === "postgres" ? "JSONB" : "TEXT";

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        ${q("message_id")} ${idType} PRIMARY KEY,
        ${q("provider_id")} ${idType} NOT NULL,
        ${q("provider_message_id")} ${idType} NOT NULL,
        ${q("type")} ${shortType} NOT NULL,
        ${q("to")} ${shortType} NOT NULL,
        ${q("from")} ${shortType},
        ${q("status")} ${shortType} NOT NULL,
        ${q("provider_status_code")} ${shortType},
        ${q("provider_status_message")} ${shortType},
        ${q("sent_at")} BIGINT,
        ${q("delivered_at")} BIGINT,
        ${q("failed_at")} BIGINT,
        ${q("requested_at")} BIGINT NOT NULL,
        ${q("scheduled_at")} BIGINT,
        ${q("status_updated_at")} BIGINT NOT NULL,
        ${q("attempt_count")} INTEGER NOT NULL DEFAULT 0,
        ${q("last_checked_at")} BIGINT,
        ${q("next_check_at")} BIGINT NOT NULL,
        ${q("last_error")} ${jsonType},
        ${q("raw")} ${jsonType},
        ${q("metadata")} ${jsonType}
      )
    `);

    await this.createIndex("idx_kmsg_delivery_due", [
      "status",
      "next_check_at",
    ]);
    await this.createIndex("idx_kmsg_delivery_provider_msg", [
      "provider_id",
      "provider_message_id",
    ]);
    await this.createIndex("idx_kmsg_delivery_requested_at", ["requested_at"]);
  }

  async upsert(record: TrackingRecord): Promise<void> {
    const columns = [
      "message_id",
      "provider_id",
      "provider_message_id",
      "type",
      "to",
      "from",
      "status",
      "provider_status_code",
      "provider_status_message",
      "sent_at",
      "delivered_at",
      "failed_at",
      "requested_at",
      "scheduled_at",
      "status_updated_at",
      "attempt_count",
      "last_checked_at",
      "next_check_at",
      "last_error",
      "raw",
      "metadata",
    ] as const;

    const values: unknown[] = [
      record.messageId,
      record.providerId,
      record.providerMessageId,
      record.type,
      record.to,
      record.from ?? null,
      record.status,
      record.providerStatusCode ?? null,
      record.providerStatusMessage ?? null,
      record.sentAt ? record.sentAt.getTime() : null,
      record.deliveredAt ? record.deliveredAt.getTime() : null,
      record.failedAt ? record.failedAt.getTime() : null,
      record.requestedAt.getTime(),
      record.scheduledAt ? record.scheduledAt.getTime() : null,
      record.statusUpdatedAt.getTime(),
      record.attemptCount,
      record.lastCheckedAt ? record.lastCheckedAt.getTime() : null,
      record.nextCheckAt.getTime(),
      record.lastError ? JSON.stringify(record.lastError) : null,
      record.raw !== undefined ? JSON.stringify(record.raw) : null,
      record.metadata ? JSON.stringify(record.metadata) : null,
    ];

    const colSql = columns
      .map((column) => this.quoteIdentifier(column))
      .join(", ");
    const valueSql = this.placeholders(columns.length).join(", ");

    if (this.client.dialect === "mysql") {
      const updates = columns
        .filter((column) => column !== "message_id")
        .map((column) => {
          const qColumn = this.quoteIdentifier(column);
          return `${qColumn} = VALUES(${qColumn})`;
        })
        .join(", ");

      await this.client.query(
        `INSERT INTO ${this.tableRef()} (${colSql}) VALUES (${valueSql}) ON DUPLICATE KEY UPDATE ${updates}`,
        values,
      );
      return;
    }

    const updates = columns
      .filter((column) => column !== "message_id")
      .map((column) => {
        const qColumn = this.quoteIdentifier(column);
        return `${qColumn} = excluded.${qColumn}`;
      })
      .join(", ");

    await this.client.query(
      `INSERT INTO ${this.tableRef()} (${colSql}) VALUES (${valueSql}) ON CONFLICT (${this.quoteIdentifier("message_id")}) DO UPDATE SET ${updates}`,
      values,
    );
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    const messageIdPlaceholder = this.placeholder(1);
    const { rows } = await this.client.query<TrackingRow>(
      `SELECT * FROM ${this.tableRef()} WHERE ${this.quoteIdentifier("message_id")} = ${messageIdPlaceholder} LIMIT 1`,
      [messageId],
    );
    const row = rows[0];
    return row ? this.rowToRecord(row) : undefined;
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    const statusPlaceholders = this.placeholders(TERMINAL_STATUSES.length, 1);
    const nowPlaceholder = this.placeholder(TERMINAL_STATUSES.length + 1);
    const limitPlaceholder = this.placeholder(TERMINAL_STATUSES.length + 2);

    const { rows } = await this.client.query<TrackingRow>(
      `SELECT * FROM ${this.tableRef()} WHERE ${this.quoteIdentifier("status")} NOT IN (${statusPlaceholders.join(", ")}) AND ${this.quoteIdentifier("next_check_at")} <= ${nowPlaceholder} ORDER BY ${this.quoteIdentifier("next_check_at")} ASC LIMIT ${limitPlaceholder}`,
      [...TERMINAL_STATUSES, now.getTime(), safeLimit],
    );

    return rows.map((row) => this.rowToRecord(row));
  }

  async listRecords(
    options: DeliveryTrackingListOptions,
  ): Promise<TrackingRecord[]> {
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
        ? "status_updated_at"
        : "requested_at";
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
    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const fieldMap: Record<DeliveryTrackingCountByField, string> = {
      providerId: "provider_id",
      type: "type",
      status: "status",
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
    const updates: Array<{ column: string; value: unknown }> = [];

    if (patch.providerId !== undefined) {
      updates.push({ column: "provider_id", value: patch.providerId });
    }
    if (patch.providerMessageId !== undefined) {
      updates.push({
        column: "provider_message_id",
        value: patch.providerMessageId,
      });
    }
    if (patch.type !== undefined) {
      updates.push({ column: "type", value: patch.type });
    }
    if (patch.to !== undefined) {
      updates.push({ column: "to", value: patch.to });
    }
    if ("from" in patch) {
      updates.push({ column: "from", value: patch.from ?? null });
    }
    if (patch.status !== undefined) {
      updates.push({ column: "status", value: patch.status });
    }
    if ("providerStatusCode" in patch) {
      updates.push({
        column: "provider_status_code",
        value: patch.providerStatusCode ?? null,
      });
    }
    if ("providerStatusMessage" in patch) {
      updates.push({
        column: "provider_status_message",
        value: patch.providerStatusMessage ?? null,
      });
    }
    if ("sentAt" in patch) {
      updates.push({
        column: "sent_at",
        value: patch.sentAt ? patch.sentAt.getTime() : null,
      });
    }
    if ("deliveredAt" in patch) {
      updates.push({
        column: "delivered_at",
        value: patch.deliveredAt ? patch.deliveredAt.getTime() : null,
      });
    }
    if ("failedAt" in patch) {
      updates.push({
        column: "failed_at",
        value: patch.failedAt ? patch.failedAt.getTime() : null,
      });
    }
    if (patch.requestedAt !== undefined) {
      updates.push({
        column: "requested_at",
        value: patch.requestedAt.getTime(),
      });
    }
    if ("scheduledAt" in patch) {
      updates.push({
        column: "scheduled_at",
        value: patch.scheduledAt ? patch.scheduledAt.getTime() : null,
      });
    }
    if (patch.statusUpdatedAt !== undefined) {
      updates.push({
        column: "status_updated_at",
        value: patch.statusUpdatedAt.getTime(),
      });
    }
    if (patch.attemptCount !== undefined) {
      updates.push({ column: "attempt_count", value: patch.attemptCount });
    }
    if ("lastCheckedAt" in patch) {
      updates.push({
        column: "last_checked_at",
        value: patch.lastCheckedAt ? patch.lastCheckedAt.getTime() : null,
      });
    }
    if (patch.nextCheckAt !== undefined) {
      updates.push({
        column: "next_check_at",
        value: patch.nextCheckAt.getTime(),
      });
    }
    if ("lastError" in patch) {
      updates.push({
        column: "last_error",
        value: patch.lastError ? JSON.stringify(patch.lastError) : null,
      });
    }
    if ("raw" in patch) {
      updates.push({
        column: "raw",
        value: patch.raw !== undefined ? JSON.stringify(patch.raw) : null,
      });
    }
    if ("metadata" in patch) {
      updates.push({
        column: "metadata",
        value: patch.metadata ? JSON.stringify(patch.metadata) : null,
      });
    }

    if (updates.length === 0) return;

    const setSql = updates
      .map(
        (update, index) =>
          `${this.quoteIdentifier(update.column)} = ${this.placeholder(index + 1)}`,
      )
      .join(", ");

    const wherePlaceholder = this.placeholder(updates.length + 1);

    await this.client.query(
      `UPDATE ${this.tableRef()} SET ${setSql} WHERE ${this.quoteIdentifier("message_id")} = ${wherePlaceholder}`,
      [...updates.map((update) => update.value), messageId],
    );
  }

  async close(): Promise<void> {
    await this.client.close?.();
  }

  private rowToRecord(row: TrackingRow): TrackingRecord {
    const requestedAt = toDate(row.requested_at) ?? new Date();
    const statusUpdatedAt = toDate(row.status_updated_at) ?? requestedAt;
    const nextCheckAt = toDate(row.next_check_at) ?? requestedAt;

    const record: TrackingRecord = {
      messageId: toStringValue(row.message_id),
      providerId: toStringValue(row.provider_id),
      providerMessageId: toStringValue(row.provider_message_id),
      type: toStringValue(row.type) as TrackingRecord["type"],
      to: toStringValue(row.to),
      requestedAt,
      status: toStringValue(row.status) as TrackingRecord["status"],
      statusUpdatedAt,
      attemptCount: toNumberValue(row.attempt_count, 0),
      nextCheckAt,
    };

    const from = toStringValue(row.from);
    if (from.length > 0) record.from = from;

    const providerStatusCode = toStringValue(row.provider_status_code);
    if (providerStatusCode.length > 0) {
      record.providerStatusCode = providerStatusCode;
    }

    const providerStatusMessage = toStringValue(row.provider_status_message);
    if (providerStatusMessage.length > 0) {
      record.providerStatusMessage = providerStatusMessage;
    }

    const scheduledAt = toDate(row.scheduled_at);
    if (scheduledAt) record.scheduledAt = scheduledAt;

    const sentAt = toDate(row.sent_at);
    if (sentAt) record.sentAt = sentAt;

    const deliveredAt = toDate(row.delivered_at);
    if (deliveredAt) record.deliveredAt = deliveredAt;

    const failedAt = toDate(row.failed_at);
    if (failedAt) record.failedAt = failedAt;

    const lastCheckedAt = toDate(row.last_checked_at);
    if (lastCheckedAt) record.lastCheckedAt = lastCheckedAt;

    const lastError = safeJsonParse<TrackingRecord["lastError"]>(
      row.last_error,
    );
    if (lastError) record.lastError = lastError;

    if (row.raw !== null && row.raw !== undefined) {
      record.raw = safeJsonParse(row.raw) ?? row.raw;
    }

    const metadata = safeJsonParse<Record<string, unknown>>(row.metadata);
    if (metadata) record.metadata = metadata;

    return record;
  }

  private tableRef(): string {
    return this.quoteIdentifier(this.tableName);
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

    addEquals("message_id", filter.messageId);
    addEquals("provider_id", filter.providerId);
    addEquals("provider_message_id", filter.providerMessageId);
    addEquals("type", filter.type);
    addEquals("status", filter.status);
    addEquals("to", filter.to);
    addEquals("from", filter.from);

    if (filter.requestedAtFrom) {
      clauses.push(
        `${this.quoteIdentifier("requested_at")} >= ${this.placeholder(params.length + 1)}`,
      );
      params.push(filter.requestedAtFrom.getTime());
    }

    if (filter.requestedAtTo) {
      clauses.push(
        `${this.quoteIdentifier("requested_at")} <= ${this.placeholder(params.length + 1)}`,
      );
      params.push(filter.requestedAtTo.getTime());
    }

    if (filter.statusUpdatedAtFrom) {
      clauses.push(
        `${this.quoteIdentifier("status_updated_at")} >= ${this.placeholder(params.length + 1)}`,
      );
      params.push(filter.statusUpdatedAtFrom.getTime());
    }

    if (filter.statusUpdatedAtTo) {
      clauses.push(
        `${this.quoteIdentifier("status_updated_at")} <= ${this.placeholder(params.length + 1)}`,
      );
      params.push(filter.statusUpdatedAtTo.getTime());
    }

    return {
      sql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
  }

  private async createIndex(
    name: string,
    columns: readonly string[],
  ): Promise<void> {
    const cols = columns
      .map((column) => this.quoteIdentifier(column))
      .join(", ");
    const sql =
      this.client.dialect === "mysql"
        ? `CREATE INDEX ${this.quoteIdentifier(name)} ON ${this.tableRef()} (${cols})`
        : `CREATE INDEX IF NOT EXISTS ${this.quoteIdentifier(name)} ON ${this.tableRef()} (${cols})`;
    try {
      await this.client.query(sql);
    } catch {
      // noop
    }
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
