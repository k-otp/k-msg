import type { SQL } from "bun";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../store.interface";
import type { TrackingRecord } from "../types";

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

export class BunSqlDeliveryTrackingStore implements DeliveryTrackingStore {
  private readonly sql: SQL;
  private readonly ownsClient: boolean;

  constructor(options: { sql?: SQL; options?: SQL.Options } = {}) {
    if (options.sql) {
      this.sql = options.sql;
      this.ownsClient = false;
    } else {
      this.sql = new Bun.SQL(
        options.options ?? { adapter: "sqlite", filename: ":memory:" },
      );
      this.ownsClient = true;
    }
  }

  async init(): Promise<void> {
    const adapter = this.sql.options?.adapter;
    const isMySql = adapter === "mysql" || adapter === "mariadb";
    const q = isMySql ? "`" : '"';
    const idType = isMySql ? "VARCHAR(255)" : "TEXT";
    const shortType = isMySql ? "VARCHAR(64)" : "TEXT";
    const phoneType = isMySql ? "VARCHAR(32)" : "TEXT";

    await this.sql.unsafe(`
      CREATE TABLE IF NOT EXISTS ${q}kmsg_delivery_tracking${q} (
        ${q}message_id${q} ${idType} PRIMARY KEY,
        ${q}provider_id${q} ${idType} NOT NULL,
        ${q}provider_message_id${q} ${idType} NOT NULL,
        ${q}type${q} ${shortType} NOT NULL,
        ${q}to${q} ${phoneType} NOT NULL,
        ${q}from${q} ${phoneType},
        ${q}status${q} ${shortType} NOT NULL,
        ${q}provider_status_code${q} ${shortType},
        ${q}provider_status_message${q} ${shortType},
        ${q}sent_at${q} BIGINT,
        ${q}delivered_at${q} BIGINT,
        ${q}failed_at${q} BIGINT,
        ${q}requested_at${q} BIGINT NOT NULL,
        ${q}scheduled_at${q} BIGINT,
        ${q}status_updated_at${q} BIGINT NOT NULL,
        ${q}attempt_count${q} INTEGER NOT NULL DEFAULT 0,
        ${q}last_checked_at${q} BIGINT,
        ${q}next_check_at${q} BIGINT NOT NULL,
        ${q}last_error${q} TEXT,
        ${q}raw${q} TEXT,
        ${q}metadata${q} TEXT
      );
    `);

    const dueIndex = isMySql
      ? `CREATE INDEX idx_kmsg_delivery_due ON ${q}kmsg_delivery_tracking${q} (${q}status${q}, ${q}next_check_at${q});`
      : `CREATE INDEX IF NOT EXISTS idx_kmsg_delivery_due ON ${q}kmsg_delivery_tracking${q} (${q}status${q}, ${q}next_check_at${q});`;
    const providerMsgIndex = isMySql
      ? `CREATE INDEX idx_kmsg_delivery_provider_msg ON ${q}kmsg_delivery_tracking${q} (${q}provider_id${q}, ${q}provider_message_id${q});`
      : `CREATE INDEX IF NOT EXISTS idx_kmsg_delivery_provider_msg ON ${q}kmsg_delivery_tracking${q} (${q}provider_id${q}, ${q}provider_message_id${q});`;

    // Best-effort indexes (MySQL doesn't support IF NOT EXISTS).
    try {
      await this.sql.unsafe(dueIndex);
    } catch {}
    try {
      await this.sql.unsafe(providerMsgIndex);
    } catch {}

    // Helpful for analytics queries.
    const requestedAtIndex = isMySql
      ? `CREATE INDEX idx_kmsg_delivery_requested_at ON ${q}kmsg_delivery_tracking${q} (${q}requested_at${q});`
      : `CREATE INDEX IF NOT EXISTS idx_kmsg_delivery_requested_at ON ${q}kmsg_delivery_tracking${q} (${q}requested_at${q});`;
    try {
      await this.sql.unsafe(requestedAtIndex);
    } catch {}

    // Best-effort migrations for existing DBs.
    const alterStatements = [
      `ALTER TABLE ${q}kmsg_delivery_tracking${q} ADD COLUMN ${q}provider_status_code${q} ${shortType};`,
      `ALTER TABLE ${q}kmsg_delivery_tracking${q} ADD COLUMN ${q}provider_status_message${q} ${shortType};`,
      `ALTER TABLE ${q}kmsg_delivery_tracking${q} ADD COLUMN ${q}sent_at${q} BIGINT;`,
      `ALTER TABLE ${q}kmsg_delivery_tracking${q} ADD COLUMN ${q}delivered_at${q} BIGINT;`,
      `ALTER TABLE ${q}kmsg_delivery_tracking${q} ADD COLUMN ${q}failed_at${q} BIGINT;`,
    ];
    for (const stmt of alterStatements) {
      try {
        await this.sql.unsafe(stmt);
      } catch {}
    }
  }

  async upsert(record: TrackingRecord): Promise<void> {
    const sql = this.sql;
    const adapter = sql.options?.adapter;
    const isMySql = adapter === "mysql" || adapter === "mariadb";

    const table = sql("kmsg_delivery_tracking");
    const excluded = sql("excluded");
    const c = {
      message_id: sql("message_id"),
      provider_id: sql("provider_id"),
      provider_message_id: sql("provider_message_id"),
      type: sql("type"),
      to: sql("to"),
      from: sql("from"),
      status: sql("status"),
      provider_status_code: sql("provider_status_code"),
      provider_status_message: sql("provider_status_message"),
      sent_at: sql("sent_at"),
      delivered_at: sql("delivered_at"),
      failed_at: sql("failed_at"),
      requested_at: sql("requested_at"),
      scheduled_at: sql("scheduled_at"),
      status_updated_at: sql("status_updated_at"),
      attempt_count: sql("attempt_count"),
      last_checked_at: sql("last_checked_at"),
      next_check_at: sql("next_check_at"),
      last_error: sql("last_error"),
      raw: sql("raw"),
      metadata: sql("metadata"),
    };

    const values = {
      messageId: record.messageId,
      providerId: record.providerId,
      providerMessageId: record.providerMessageId ?? "",
      type: record.type,
      to: record.to,
      from: record.from ?? null,
      status: record.status,
      providerStatusCode: record.providerStatusCode ?? null,
      providerStatusMessage: record.providerStatusMessage ?? null,
      sentAt: record.sentAt ? record.sentAt.getTime() : null,
      deliveredAt: record.deliveredAt ? record.deliveredAt.getTime() : null,
      failedAt: record.failedAt ? record.failedAt.getTime() : null,
      requestedAt: record.requestedAt.getTime(),
      scheduledAt: record.scheduledAt ? record.scheduledAt.getTime() : null,
      statusUpdatedAt: record.statusUpdatedAt.getTime(),
      attemptCount: record.attemptCount,
      lastCheckedAt: record.lastCheckedAt
        ? record.lastCheckedAt.getTime()
        : null,
      nextCheckAt: record.nextCheckAt.getTime(),
      lastError: record.lastError ? JSON.stringify(record.lastError) : null,
      raw: record.raw !== undefined ? JSON.stringify(record.raw) : null,
      metadata: record.metadata ? JSON.stringify(record.metadata) : null,
    };

    if (isMySql) {
      await sql`
        INSERT INTO ${table} (
          ${c.message_id},
          ${c.provider_id},
          ${c.provider_message_id},
          ${c.type},
          ${c.to},
          ${c.from},
          ${c.status},
          ${c.provider_status_code},
          ${c.provider_status_message},
          ${c.sent_at},
          ${c.delivered_at},
          ${c.failed_at},
          ${c.requested_at},
          ${c.scheduled_at},
          ${c.status_updated_at},
          ${c.attempt_count},
          ${c.last_checked_at},
          ${c.next_check_at},
          ${c.last_error},
          ${c.raw},
          ${c.metadata}
        ) VALUES (
          ${values.messageId},
          ${values.providerId},
          ${values.providerMessageId},
          ${values.type},
          ${values.to},
          ${values.from},
          ${values.status},
          ${values.providerStatusCode},
          ${values.providerStatusMessage},
          ${values.sentAt},
          ${values.deliveredAt},
          ${values.failedAt},
          ${values.requestedAt},
          ${values.scheduledAt},
          ${values.statusUpdatedAt},
          ${values.attemptCount},
          ${values.lastCheckedAt},
          ${values.nextCheckAt},
          ${values.lastError},
          ${values.raw},
          ${values.metadata}
        )
        ON DUPLICATE KEY UPDATE
          ${c.provider_id} = VALUES(${c.provider_id}),
          ${c.provider_message_id} = VALUES(${c.provider_message_id}),
          ${c.type} = VALUES(${c.type}),
          ${c.to} = VALUES(${c.to}),
          ${c.from} = VALUES(${c.from}),
          ${c.status} = VALUES(${c.status}),
          ${c.provider_status_code} = VALUES(${c.provider_status_code}),
          ${c.provider_status_message} = VALUES(${c.provider_status_message}),
          ${c.sent_at} = VALUES(${c.sent_at}),
          ${c.delivered_at} = VALUES(${c.delivered_at}),
          ${c.failed_at} = VALUES(${c.failed_at}),
          ${c.requested_at} = VALUES(${c.requested_at}),
          ${c.scheduled_at} = VALUES(${c.scheduled_at}),
          ${c.status_updated_at} = VALUES(${c.status_updated_at}),
          ${c.attempt_count} = VALUES(${c.attempt_count}),
          ${c.last_checked_at} = VALUES(${c.last_checked_at}),
          ${c.next_check_at} = VALUES(${c.next_check_at}),
          ${c.last_error} = VALUES(${c.last_error}),
          ${c.raw} = VALUES(${c.raw}),
          ${c.metadata} = VALUES(${c.metadata})
      `;
      return;
    }

    await sql`
      INSERT INTO ${table} (
        ${c.message_id},
        ${c.provider_id},
        ${c.provider_message_id},
        ${c.type},
        ${c.to},
        ${c.from},
        ${c.status},
        ${c.provider_status_code},
        ${c.provider_status_message},
        ${c.sent_at},
        ${c.delivered_at},
        ${c.failed_at},
        ${c.requested_at},
        ${c.scheduled_at},
        ${c.status_updated_at},
        ${c.attempt_count},
        ${c.last_checked_at},
        ${c.next_check_at},
        ${c.last_error},
        ${c.raw},
        ${c.metadata}
      ) VALUES (
        ${values.messageId},
        ${values.providerId},
        ${values.providerMessageId},
        ${values.type},
        ${values.to},
        ${values.from},
        ${values.status},
        ${values.providerStatusCode},
        ${values.providerStatusMessage},
        ${values.sentAt},
        ${values.deliveredAt},
        ${values.failedAt},
        ${values.requestedAt},
        ${values.scheduledAt},
        ${values.statusUpdatedAt},
        ${values.attemptCount},
        ${values.lastCheckedAt},
        ${values.nextCheckAt},
        ${values.lastError},
        ${values.raw},
        ${values.metadata}
      )
      ON CONFLICT (${c.message_id}) DO UPDATE SET
        ${c.provider_id} = ${excluded}.${c.provider_id},
        ${c.provider_message_id} = ${excluded}.${c.provider_message_id},
        ${c.type} = ${excluded}.${c.type},
        ${c.to} = ${excluded}.${c.to},
        ${c.from} = ${excluded}.${c.from},
        ${c.status} = ${excluded}.${c.status},
        ${c.provider_status_code} = ${excluded}.${c.provider_status_code},
        ${c.provider_status_message} = ${excluded}.${c.provider_status_message},
        ${c.sent_at} = ${excluded}.${c.sent_at},
        ${c.delivered_at} = ${excluded}.${c.delivered_at},
        ${c.failed_at} = ${excluded}.${c.failed_at},
        ${c.requested_at} = ${excluded}.${c.requested_at},
        ${c.scheduled_at} = ${excluded}.${c.scheduled_at},
        ${c.status_updated_at} = ${excluded}.${c.status_updated_at},
        ${c.attempt_count} = ${excluded}.${c.attempt_count},
        ${c.last_checked_at} = ${excluded}.${c.last_checked_at},
        ${c.next_check_at} = ${excluded}.${c.next_check_at},
        ${c.last_error} = ${excluded}.${c.last_error},
        ${c.raw} = ${excluded}.${c.raw},
        ${c.metadata} = ${excluded}.${c.metadata}
    `;
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    const sql = this.sql;
    const table = sql("kmsg_delivery_tracking");
    const c = { message_id: sql("message_id") };

    const rows = (await sql<TrackingRow[]>`
      SELECT *
      FROM ${table}
      WHERE ${c.message_id} = ${messageId}
      LIMIT 1
    `) as unknown as TrackingRow[];

    const row = rows[0];
    return row ? this.rowToRecord(row) : undefined;
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    const sql = this.sql;
    const table = sql("kmsg_delivery_tracking");
    const c = {
      status: sql("status"),
      next_check_at: sql("next_check_at"),
    };

    const terminalStatuses = ["DELIVERED", "FAILED", "CANCELLED", "UNKNOWN"];

    const rows = (await sql<TrackingRow[]>`
      SELECT *
      FROM ${table}
      WHERE ${c.status} NOT IN ${sql(terminalStatuses)}
        AND ${c.next_check_at} <= ${now.getTime()}
      ORDER BY ${c.next_check_at} ASC
      LIMIT ${safeLimit}
    `) as unknown as TrackingRow[];

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

    const orderBy = options.orderBy ?? "requestedAt";
    const orderDirection = options.orderDirection ?? "desc";
    const orderByColumn =
      orderBy === "statusUpdatedAt" ? "status_updated_at" : "requested_at";
    const dir = orderDirection === "asc" ? "ASC" : "DESC";

    const { whereSql, args, placeholder } = this.buildWhere(options);
    const q = this.getQuote();
    const table = `${q}kmsg_delivery_tracking${q}`;

    const limitPlaceholder = placeholder(args.length + 1);
    args.push(safeLimit);
    const offsetPlaceholder = placeholder(args.length + 1);
    args.push(safeOffset);

    const sql = `
      SELECT
        message_id,
        provider_id,
        provider_message_id,
        type,
        ${q}to${q},
        ${q}from${q},
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
      FROM ${table}
      ${whereSql}
      ORDER BY ${q}${orderByColumn}${q} ${dir}
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
    `;

    const rows = (await this.sql.unsafe(sql, args)) as unknown as TrackingRow[];
    return rows.map((row) => this.rowToRecord(row));
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    const { whereSql, args } = this.buildWhere(filter);
    const q = this.getQuote();
    const table = `${q}kmsg_delivery_tracking${q}`;

    const sql = `
      SELECT COUNT(1) as count
      FROM ${table}
      ${whereSql}
    `;

    const rows = (await this.sql.unsafe(sql, args)) as unknown as Array<{
      count: number;
    }>;
    const row = rows[0];
    return row ? Number(row.count) : 0;
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const fieldToColumn: Record<DeliveryTrackingCountByField, string> = {
      providerId: "provider_id",
      type: "type",
      status: "status",
    };

    const columns = fields.map((f) => fieldToColumn[f]).filter(Boolean);
    const q = this.getQuote();
    const table = `${q}kmsg_delivery_tracking${q}`;

    const selectCols = columns.map((c) => `${q}${c}${q}`).join(", ");
    const groupCols = columns.map((c) => `${q}${c}${q}`).join(", ");

    const { whereSql, args } = this.buildWhere(filter);

    const sql = `
      SELECT ${selectCols}, COUNT(1) as count
      FROM ${table}
      ${whereSql}
      GROUP BY ${groupCols}
    `;

    const rows = (await this.sql.unsafe(sql, args)) as unknown as Array<
      Record<string, unknown>
    >;
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
    const existing = await this.get(messageId);
    if (!existing) return;

    const merged: TrackingRecord = {
      ...existing,
      ...patch,
      messageId: existing.messageId,
    };

    await this.upsert(merged);
  }

  async close(): Promise<void> {
    if (this.ownsClient) {
      await this.sql.close();
    }
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

  private getQuote(): string {
    const adapter = this.sql.options?.adapter;
    return adapter === "mysql" || adapter === "mariadb" ? "`" : '"';
  }

  private buildWhere(filter: DeliveryTrackingRecordFilter): {
    whereSql: string;
    args: unknown[];
    placeholder: (index: number) => string;
  } {
    const adapter = this.sql.options?.adapter;
    const q = this.getQuote();
    const isPostgres = adapter === "postgres";

    const args: unknown[] = [];
    const placeholder = (index: number) => (isPostgres ? `$${index}` : "?");

    const clauses: string[] = [];

    // Helper: push a single value and return its placeholder.
    const pushValue = (value: unknown) => {
      const ph = placeholder(args.length + 1);
      args.push(value);
      return ph;
    };

    const pushInList = (columnSql: string, values: unknown[]) => {
      const placeholders: string[] = [];
      for (const v of values) {
        placeholders.push(pushValue(v));
      }
      clauses.push(`${columnSql} IN (${placeholders.join(", ")})`);
    };

    const messageIds = toArray(filter.messageId);
    if (messageIds && messageIds.length > 0) {
      pushInList(`${q}message_id${q}`, messageIds);
    }

    const providerIds = toArray(filter.providerId);
    if (providerIds && providerIds.length > 0) {
      pushInList(`${q}provider_id${q}`, providerIds);
    }

    const providerMessageIds = toArray(filter.providerMessageId);
    if (providerMessageIds && providerMessageIds.length > 0) {
      pushInList(`${q}provider_message_id${q}`, providerMessageIds);
    }

    const types = toArray(filter.type);
    if (types && types.length > 0) {
      pushInList(`${q}type${q}`, types);
    }

    const statuses = toArray(filter.status);
    if (statuses && statuses.length > 0) {
      pushInList(`${q}status${q}`, statuses);
    }

    const tos = toArray(filter.to);
    if (tos && tos.length > 0) {
      pushInList(`${q}to${q}`, tos);
    }

    const froms = toArray(filter.from);
    if (froms && froms.length > 0) {
      pushInList(`${q}from${q}`, froms);
    }

    if (filter.requestedAtFrom instanceof Date) {
      clauses.push(
        `${q}requested_at${q} >= ${pushValue(filter.requestedAtFrom.getTime())}`,
      );
    }
    if (filter.requestedAtTo instanceof Date) {
      clauses.push(
        `${q}requested_at${q} <= ${pushValue(filter.requestedAtTo.getTime())}`,
      );
    }

    if (filter.statusUpdatedAtFrom instanceof Date) {
      clauses.push(
        `${q}status_updated_at${q} >= ${pushValue(filter.statusUpdatedAtFrom.getTime())}`,
      );
    }
    if (filter.statusUpdatedAtTo instanceof Date) {
      clauses.push(
        `${q}status_updated_at${q} <= ${pushValue(filter.statusUpdatedAtTo.getTime())}`,
      );
    }

    return {
      whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
      args,
      placeholder,
    };
  }
}
