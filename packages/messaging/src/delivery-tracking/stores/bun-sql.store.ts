import type { SQL } from "bun";
import type { DeliveryTrackingStore } from "../store.interface";
import type { TrackingRecord } from "../types";

type TrackingRow = {
  message_id: string;
  provider_id: string;
  provider_message_id: string;
  type: string;
  to: string;
  from: string | null;
  status: string;
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
