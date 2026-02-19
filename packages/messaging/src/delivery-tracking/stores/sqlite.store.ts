import Database from "bun:sqlite";
import { initializeCloudflareSqlSchema } from "../../adapters/cloudflare/sql-schema";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../store.interface";
import type { TrackingRecord } from "../types";

interface SqliteDeliveryTrackingStoreOptions {
  dbPath?: string;
}

type TrackingRow = {
  message_id: string;
  provider_id: string;
  provider_message_id: string;
  type: string;
  to: string;
  from: string | null;
  status: string;
  provider_status_code: string | null;
  provider_status_message: string | null;
  sent_at: number | null;
  delivered_at: number | null;
  failed_at: number | null;
  requested_at: number;
  scheduled_at: number | null;
  status_updated_at: number;
  attempt_count: number;
  last_checked_at: number | null;
  next_check_at: number;
  last_error: string | null;
  raw: string | null;
  metadata: string | null;
};

function safeJsonParse<T>(value: string | null): T | undefined {
  if (!value) return undefined;
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

type SqliteBindingValue = string | number;

export class SqliteDeliveryTrackingStore implements DeliveryTrackingStore {
  private readonly db: Database;
  private initPromise: Promise<void> | undefined;

  constructor(options: SqliteDeliveryTrackingStoreOptions = {}) {
    this.db = new Database(options.dbPath ?? "./kmsg.sqlite");
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.db.exec("PRAGMA journal_mode = WAL;");

      await initializeCloudflareSqlSchema(
        {
          dialect: "sqlite",
          query: async (sql) => {
            this.db.exec(sql);
            return { rows: [] };
          },
        },
        {
          target: "tracking",
          trackingTableName: "kmsg_delivery_tracking",
        },
      );

      // Best-effort schema migration for existing DBs.
      const alterStmts = [
        "ALTER TABLE kmsg_delivery_tracking ADD COLUMN provider_status_code TEXT;",
        "ALTER TABLE kmsg_delivery_tracking ADD COLUMN provider_status_message TEXT;",
        "ALTER TABLE kmsg_delivery_tracking ADD COLUMN sent_at INTEGER;",
        "ALTER TABLE kmsg_delivery_tracking ADD COLUMN delivered_at INTEGER;",
        "ALTER TABLE kmsg_delivery_tracking ADD COLUMN failed_at INTEGER;",
      ];
      for (const stmt of alterStmts) {
        try {
          this.db.exec(stmt);
        } catch {
          // ignore
        }
      }
    })().catch((error) => {
      this.initPromise = undefined;
      throw error;
    });

    return this.initPromise;
  }

  async upsert(record: TrackingRecord): Promise<void> {
    await this.init();

    const stmt = this.db.prepare(`
      INSERT INTO kmsg_delivery_tracking (
        message_id,
        provider_id,
        provider_message_id,
        type,
        "to",
        "from",
        status,
        provider_status_code,
        provider_status_message,
        sent_at,
        delivered_at,
        failed_at,
        requested_at,
        scheduled_at,
        status_updated_at,
        attempt_count,
        last_checked_at,
        next_check_at,
        last_error,
        raw,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(message_id) DO UPDATE SET
        provider_id = excluded.provider_id,
        provider_message_id = excluded.provider_message_id,
        type = excluded.type,
        "to" = excluded."to",
        "from" = excluded."from",
        status = excluded.status,
        provider_status_code = excluded.provider_status_code,
        provider_status_message = excluded.provider_status_message,
        sent_at = excluded.sent_at,
        delivered_at = excluded.delivered_at,
        failed_at = excluded.failed_at,
        requested_at = excluded.requested_at,
        scheduled_at = excluded.scheduled_at,
        status_updated_at = excluded.status_updated_at,
        attempt_count = excluded.attempt_count,
        last_checked_at = excluded.last_checked_at,
        next_check_at = excluded.next_check_at,
        last_error = excluded.last_error,
        raw = excluded.raw,
        metadata = excluded.metadata
    `);

    stmt.run(
      record.messageId,
      record.providerId,
      record.providerMessageId ?? "",
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
    );
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    await this.init();

    const stmt = this.db.prepare(`
	      SELECT
	        message_id,
	        provider_id,
	        provider_message_id,
	        type,
	        "to",
	        "from",
	        status,
        provider_status_code,
        provider_status_message,
        sent_at,
        delivered_at,
        failed_at,
	        requested_at,
	        scheduled_at,
	        status_updated_at,
	        attempt_count,
        last_checked_at,
        next_check_at,
        last_error,
        raw,
        metadata
      FROM kmsg_delivery_tracking
      WHERE message_id = ?
    `);

    const row = stmt.get(messageId) as TrackingRow | undefined;
    if (!row) return undefined;
    return this.rowToRecord(row);
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    await this.init();

    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    const stmt = this.db.prepare(`
	      SELECT
	        message_id,
	        provider_id,
	        provider_message_id,
	        type,
	        "to",
	        "from",
	        status,
        provider_status_code,
        provider_status_message,
        sent_at,
        delivered_at,
        failed_at,
	        requested_at,
	        scheduled_at,
	        status_updated_at,
	        attempt_count,
        last_checked_at,
        next_check_at,
        last_error,
        raw,
        metadata
      FROM kmsg_delivery_tracking
      WHERE status NOT IN ('DELIVERED', 'FAILED', 'CANCELLED', 'UNKNOWN')
        AND next_check_at <= ?
      ORDER BY next_check_at ASC
      LIMIT ?
    `);

    const rows = stmt.all(now.getTime(), safeLimit) as TrackingRow[];
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

    const orderBy = options.orderBy ?? "requestedAt";
    const orderDirection = options.orderDirection ?? "desc";
    const orderByColumn =
      orderBy === "statusUpdatedAt" ? "status_updated_at" : "requested_at";
    const dir = orderDirection === "asc" ? "ASC" : "DESC";

    const { whereSql, params } = this.buildWhere(options);

    const stmt = this.db.prepare(`
      SELECT
        message_id,
        provider_id,
        provider_message_id,
        type,
        "to",
        "from",
        status,
        provider_status_code,
        provider_status_message,
        sent_at,
        delivered_at,
        failed_at,
        requested_at,
        scheduled_at,
        status_updated_at,
        attempt_count,
        last_checked_at,
        next_check_at,
        last_error,
        raw,
        metadata
      FROM kmsg_delivery_tracking
      ${whereSql}
      ORDER BY ${orderByColumn} ${dir}
      LIMIT ?
      OFFSET ?
    `);

    const rows = stmt.all(...params, safeLimit, safeOffset) as TrackingRow[];
    return rows.map((row) => this.rowToRecord(row));
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    await this.init();

    const { whereSql, params } = this.buildWhere(filter);
    const stmt = this.db.prepare(`
      SELECT COUNT(1) as count
      FROM kmsg_delivery_tracking
      ${whereSql}
    `);
    const row = stmt.get(...params) as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    await this.init();

    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const fieldToColumn: Record<DeliveryTrackingCountByField, string> = {
      providerId: "provider_id",
      type: "type",
      status: "status",
    };

    const columns = fields.map((f) => fieldToColumn[f]).filter(Boolean);
    const selectCols = columns.join(", ");
    const groupCols = columns.join(", ");

    const { whereSql, params } = this.buildWhere(filter);
    const stmt = this.db.prepare(`
      SELECT ${selectCols}, COUNT(1) as count
      FROM kmsg_delivery_tracking
      ${whereSql}
      GROUP BY ${groupCols}
    `);

    const rows = stmt.all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => {
      const key: Record<string, string> = {};
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const col = columns[i];
        const raw = row[col];
        key[field] = raw === undefined || raw === null ? "" : String(raw);
      }

      return {
        key,
        count: Number(row.count ?? 0),
      };
    });
  }

  async patch(
    messageId: string,
    patch: Partial<TrackingRecord>,
  ): Promise<void> {
    await this.init();

    const existing = await this.get(messageId);
    if (!existing) return;

    const merged: TrackingRecord = {
      ...existing,
      ...patch,
      messageId: existing.messageId,
    };

    await this.upsert(merged);
  }

  close(): void {
    this.db.close();
  }

  private buildWhere(filter: DeliveryTrackingRecordFilter): {
    whereSql: string;
    params: SqliteBindingValue[];
  } {
    const clauses: string[] = [];
    const params: SqliteBindingValue[] = [];

    const pushIn = (columnSql: string, values: SqliteBindingValue[]) => {
      const placeholders = values.map(() => "?").join(", ");
      clauses.push(`${columnSql} IN (${placeholders})`);
      params.push(...values);
    };

    const messageIds = toArray(filter.messageId);
    if (messageIds && messageIds.length > 0) pushIn("message_id", messageIds);

    const providerIds = toArray(filter.providerId);
    if (providerIds && providerIds.length > 0)
      pushIn("provider_id", providerIds);

    const providerMessageIds = toArray(filter.providerMessageId);
    if (providerMessageIds && providerMessageIds.length > 0) {
      pushIn("provider_message_id", providerMessageIds);
    }

    const types = toArray(filter.type);
    if (types && types.length > 0) pushIn("type", types);

    const statuses = toArray(filter.status);
    if (statuses && statuses.length > 0) pushIn("status", statuses);

    const tos = toArray(filter.to);
    if (tos && tos.length > 0) pushIn('"to"', tos);

    const froms = toArray(filter.from);
    if (froms && froms.length > 0) pushIn('"from"', froms);

    if (filter.requestedAtFrom instanceof Date) {
      clauses.push("requested_at >= ?");
      params.push(filter.requestedAtFrom.getTime());
    }
    if (filter.requestedAtTo instanceof Date) {
      clauses.push("requested_at <= ?");
      params.push(filter.requestedAtTo.getTime());
    }

    if (filter.statusUpdatedAtFrom instanceof Date) {
      clauses.push("status_updated_at >= ?");
      params.push(filter.statusUpdatedAtFrom.getTime());
    }
    if (filter.statusUpdatedAtTo instanceof Date) {
      clauses.push("status_updated_at <= ?");
      params.push(filter.statusUpdatedAtTo.getTime());
    }

    return {
      whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
  }

  private rowToRecord(row: TrackingRow): TrackingRecord {
    return {
      messageId: row.message_id,
      providerId: row.provider_id,
      providerMessageId: row.provider_message_id,
      type: row.type as TrackingRecord["type"],
      to: row.to,
      from: row.from ?? undefined,
      requestedAt: new Date(row.requested_at),
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      status: row.status as TrackingRecord["status"],
      providerStatusCode: row.provider_status_code ?? undefined,
      providerStatusMessage: row.provider_status_message ?? undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
      statusUpdatedAt: new Date(row.status_updated_at),
      attemptCount: row.attempt_count,
      lastCheckedAt: row.last_checked_at
        ? new Date(row.last_checked_at)
        : undefined,
      nextCheckAt: new Date(row.next_check_at),
      lastError: safeJsonParse<TrackingRecord["lastError"]>(row.last_error),
      raw: safeJsonParse<unknown>(row.raw),
      metadata: safeJsonParse<TrackingRecord["metadata"]>(row.metadata),
    };
  }
}
