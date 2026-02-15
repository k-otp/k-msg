import Database from "bun:sqlite";
import type { DeliveryTrackingStore } from "../store.interface";
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

export class SqliteDeliveryTrackingStore implements DeliveryTrackingStore {
  private readonly db: Database;
  private initialized = false;

  constructor(options: SqliteDeliveryTrackingStoreOptions = {}) {
    this.db = new Database(options.dbPath ?? "./kmsg.sqlite");
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.db.exec("PRAGMA journal_mode = WAL;");

    // NOTE: Column names like "from" are reserved keywords in SQLite.
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kmsg_delivery_tracking (
        message_id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        provider_message_id TEXT NOT NULL,
        type TEXT NOT NULL,
        "to" TEXT NOT NULL,
        "from" TEXT,
        status TEXT NOT NULL,
        requested_at INTEGER NOT NULL,
        scheduled_at INTEGER,
        status_updated_at INTEGER NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_checked_at INTEGER,
        next_check_at INTEGER NOT NULL,
        last_error TEXT,
        raw TEXT,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_kmsg_delivery_due
        ON kmsg_delivery_tracking(status, next_check_at);

      CREATE INDEX IF NOT EXISTS idx_kmsg_delivery_provider_msg
        ON kmsg_delivery_tracking(provider_id, provider_message_id);
    `);
  }

  async upsert(record: TrackingRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO kmsg_delivery_tracking (
        message_id,
        provider_id,
        provider_message_id,
        type,
        "to",
        "from",
        status,
        requested_at,
        scheduled_at,
        status_updated_at,
        attempt_count,
        last_checked_at,
        next_check_at,
        last_error,
        raw,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(message_id) DO UPDATE SET
        provider_id = excluded.provider_id,
        provider_message_id = excluded.provider_message_id,
        type = excluded.type,
        "to" = excluded."to",
        "from" = excluded."from",
        status = excluded.status,
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
	    const stmt = this.db.prepare(`
	      SELECT
	        message_id,
	        provider_id,
	        provider_message_id,
	        type,
	        "to",
	        "from",
	        status,
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
	    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
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

  async patch(messageId: string, patch: Partial<TrackingRecord>): Promise<void> {
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
      lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at) : undefined,
      nextCheckAt: new Date(row.next_check_at),
      lastError: safeJsonParse<TrackingRecord["lastError"]>(row.last_error),
      raw: safeJsonParse<unknown>(row.raw),
      metadata: safeJsonParse<TrackingRecord["metadata"]>(row.metadata),
    };
  }
}
