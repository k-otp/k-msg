import type {
  CloudflareSqlClient,
  SqlDialect,
} from "../../adapters/cloudflare/sql-client";
import type {
  FieldCryptoMigrationChunkRecord,
  FieldCryptoMigrationRunRecord,
  FieldCryptoMigrationRunStatus,
  FieldCryptoMigrationStateTables,
  FieldCryptoMigrationStatus,
} from "./types";

export const DEFAULT_CRYPTO_MIGRATION_RUNS_TABLE = "kmsg_crypto_migration_runs";
export const DEFAULT_CRYPTO_MIGRATION_CHUNKS_TABLE =
  "kmsg_crypto_migration_chunks";

interface MigrationStateTablesResolved {
  runsTableName: string;
  chunksTableName: string;
}

type MigrationRow = Record<string, unknown>;

function normalizeIdentifier(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function resolveStateTables(
  options: FieldCryptoMigrationStateTables = {},
): MigrationStateTablesResolved {
  return {
    runsTableName: normalizeIdentifier(
      options.runsTableName,
      DEFAULT_CRYPTO_MIGRATION_RUNS_TABLE,
    ),
    chunksTableName: normalizeIdentifier(
      options.chunksTableName,
      DEFAULT_CRYPTO_MIGRATION_CHUNKS_TABLE,
    ),
  };
}

function quoteIdentifier(dialect: SqlDialect, identifier: string): string {
  if (dialect === "mysql") {
    return `\`${identifier.replace(/`/g, "``")}\``;
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function placeholder(dialect: SqlDialect, index: number): string {
  return dialect === "postgres" ? `$${index}` : "?";
}

function placeholders(dialect: SqlDialect, count: number, start = 1): string[] {
  return Array.from({ length: count }, (_, index) =>
    placeholder(dialect, start + index),
  );
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toMaybeNumber(value: unknown): number | undefined {
  const normalized = toNumber(value);
  return normalized > 0 ? normalized : undefined;
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseMessageIds(value: unknown): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  } catch {
    return [];
  }
}

function toRunRecord(row: MigrationRow): FieldCryptoMigrationRunRecord {
  return {
    planId: String(row.plan_id ?? ""),
    trackingTableName: String(row.tracking_table_name ?? ""),
    schemaFingerprint: String(row.schema_fingerprint ?? ""),
    status: String(row.status ?? "planned") as FieldCryptoMigrationRunStatus,
    chunkSize: toNumber(row.chunk_size),
    totalRows: toNumber(row.total_rows),
    totalChunks: toNumber(row.total_chunks),
    processedRows: toNumber(row.processed_rows),
    processedChunks: toNumber(row.processed_chunks),
    failedChunks: toNumber(row.failed_chunks),
    cursorRequestedAt: toMaybeNumber(row.cursor_requested_at),
    cursorMessageId: toStringValue(row.cursor_message_id),
    createdAt: toNumber(row.created_at),
    updatedAt: toNumber(row.updated_at),
    lastError: toStringValue(row.last_error),
  };
}

function toChunkRecord(row: MigrationRow): FieldCryptoMigrationChunkRecord {
  return {
    planId: String(row.plan_id ?? ""),
    chunkNo: toNumber(row.chunk_no),
    status: String(
      row.status ?? "pending",
    ) as FieldCryptoMigrationChunkRecord["status"],
    startRequestedAt: toMaybeNumber(row.start_requested_at),
    startMessageId: toStringValue(row.start_message_id),
    endRequestedAt: toMaybeNumber(row.end_requested_at),
    endMessageId: toStringValue(row.end_message_id),
    processedRows: toNumber(row.processed_rows),
    attempts: toNumber(row.attempts),
    messageIds: parseMessageIds(row.message_ids_json),
    lastError: toStringValue(row.last_error),
    updatedAt: toNumber(row.updated_at),
  };
}

export async function ensureFieldCryptoMigrationStateTables(
  client: CloudflareSqlClient,
  options: FieldCryptoMigrationStateTables = {},
): Promise<void> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const runsTable = q(tables.runsTableName);
  const chunksTable = q(tables.chunksTableName);

  const createRuns = `
CREATE TABLE IF NOT EXISTS ${runsTable} (
  ${q("plan_id")} TEXT PRIMARY KEY,
  ${q("tracking_table_name")} TEXT NOT NULL,
  ${q("schema_fingerprint")} TEXT NOT NULL,
  ${q("status")} TEXT NOT NULL,
  ${q("chunk_size")} INTEGER NOT NULL,
  ${q("total_rows")} INTEGER NOT NULL DEFAULT 0,
  ${q("total_chunks")} INTEGER NOT NULL DEFAULT 0,
  ${q("processed_rows")} INTEGER NOT NULL DEFAULT 0,
  ${q("processed_chunks")} INTEGER NOT NULL DEFAULT 0,
  ${q("failed_chunks")} INTEGER NOT NULL DEFAULT 0,
  ${q("cursor_requested_at")} BIGINT,
  ${q("cursor_message_id")} TEXT,
  ${q("created_at")} BIGINT NOT NULL,
  ${q("updated_at")} BIGINT NOT NULL,
  ${q("last_error")} TEXT
)`;

  const createChunks = `
CREATE TABLE IF NOT EXISTS ${chunksTable} (
  ${q("plan_id")} TEXT NOT NULL,
  ${q("chunk_no")} INTEGER NOT NULL,
  ${q("status")} TEXT NOT NULL,
  ${q("start_requested_at")} BIGINT,
  ${q("start_message_id")} TEXT,
  ${q("end_requested_at")} BIGINT,
  ${q("end_message_id")} TEXT,
  ${q("processed_rows")} INTEGER NOT NULL DEFAULT 0,
  ${q("attempts")} INTEGER NOT NULL DEFAULT 0,
  ${q("message_ids_json")} TEXT,
  ${q("last_error")} TEXT,
  ${q("updated_at")} BIGINT NOT NULL,
  PRIMARY KEY (${q("plan_id")}, ${q("chunk_no")})
)`;

  const createChunksStatusIndex =
    client.dialect === "mysql"
      ? `CREATE INDEX ${q(`${tables.chunksTableName}_status_idx`)} ON ${chunksTable} (${q("plan_id")}, ${q("status")})`
      : `CREATE INDEX IF NOT EXISTS ${q(`${tables.chunksTableName}_status_idx`)} ON ${chunksTable} (${q("plan_id")}, ${q("status")})`;

  await client.query(createRuns);
  await client.query(createChunks);
  await client.query(createChunksStatusIndex);
}

export async function upsertFieldCryptoMigrationRun(
  client: CloudflareSqlClient,
  input: FieldCryptoMigrationRunRecord,
  options: FieldCryptoMigrationStateTables = {},
): Promise<void> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(tables.runsTableName);

  const columns = [
    "plan_id",
    "tracking_table_name",
    "schema_fingerprint",
    "status",
    "chunk_size",
    "total_rows",
    "total_chunks",
    "processed_rows",
    "processed_chunks",
    "failed_chunks",
    "cursor_requested_at",
    "cursor_message_id",
    "created_at",
    "updated_at",
    "last_error",
  ];
  const values = [
    input.planId,
    input.trackingTableName,
    input.schemaFingerprint,
    input.status,
    input.chunkSize,
    input.totalRows,
    input.totalChunks,
    input.processedRows,
    input.processedChunks,
    input.failedChunks,
    input.cursorRequestedAt ?? null,
    input.cursorMessageId ?? null,
    input.createdAt,
    input.updatedAt,
    input.lastError ?? null,
  ];
  const placeholdersSql = placeholders(client.dialect, values.length).join(
    ", ",
  );
  const columnsSql = columns.map((column) => q(column)).join(", ");
  const updateSql = columns
    .slice(1)
    .map(
      (column) =>
        `${q(column)} = ${client.dialect === "mysql" ? `VALUES(${q(column)})` : `excluded.${q(column)}`}`,
    )
    .join(", ");

  const conflictClause =
    client.dialect === "mysql"
      ? `ON DUPLICATE KEY UPDATE ${updateSql}`
      : `ON CONFLICT (${q("plan_id")}) DO UPDATE SET ${updateSql}`;

  await client.query(
    `INSERT INTO ${tableRef} (${columnsSql}) VALUES (${placeholdersSql}) ${conflictClause}`,
    values,
  );
}

export async function getFieldCryptoMigrationRun(
  client: CloudflareSqlClient,
  planId: string,
  options: FieldCryptoMigrationStateTables = {},
): Promise<FieldCryptoMigrationRunRecord | undefined> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(tables.runsTableName);
  const idPlaceholder = placeholder(client.dialect, 1);

  const { rows } = await client.query<MigrationRow>(
    `SELECT * FROM ${tableRef} WHERE ${q("plan_id")} = ${idPlaceholder} LIMIT 1`,
    [planId],
  );

  const row = rows[0];
  return row ? toRunRecord(row) : undefined;
}

export async function getLatestFieldCryptoMigrationRun(
  client: CloudflareSqlClient,
  trackingTableName: string,
  options: FieldCryptoMigrationStateTables = {},
): Promise<FieldCryptoMigrationRunRecord | undefined> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(tables.runsTableName);
  const tablePlaceholder = placeholder(client.dialect, 1);

  const { rows } = await client.query<MigrationRow>(
    `SELECT * FROM ${tableRef} WHERE ${q("tracking_table_name")} = ${tablePlaceholder} ORDER BY ${q("updated_at")} DESC LIMIT 1`,
    [trackingTableName],
  );
  const row = rows[0];
  return row ? toRunRecord(row) : undefined;
}

export async function upsertFieldCryptoMigrationChunk(
  client: CloudflareSqlClient,
  chunk: FieldCryptoMigrationChunkRecord,
  options: FieldCryptoMigrationStateTables = {},
): Promise<void> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(tables.chunksTableName);
  const columns = [
    "plan_id",
    "chunk_no",
    "status",
    "start_requested_at",
    "start_message_id",
    "end_requested_at",
    "end_message_id",
    "processed_rows",
    "attempts",
    "message_ids_json",
    "last_error",
    "updated_at",
  ];
  const values = [
    chunk.planId,
    chunk.chunkNo,
    chunk.status,
    chunk.startRequestedAt ?? null,
    chunk.startMessageId ?? null,
    chunk.endRequestedAt ?? null,
    chunk.endMessageId ?? null,
    chunk.processedRows,
    chunk.attempts,
    chunk.messageIds ? JSON.stringify(chunk.messageIds) : null,
    chunk.lastError ?? null,
    chunk.updatedAt,
  ];
  const placeholdersSql = placeholders(client.dialect, values.length).join(
    ", ",
  );
  const columnsSql = columns.map((column) => q(column)).join(", ");
  const updateColumns = columns
    .filter((column) => column !== "plan_id" && column !== "chunk_no")
    .map(
      (column) =>
        `${q(column)} = ${
          client.dialect === "mysql"
            ? `VALUES(${q(column)})`
            : `excluded.${q(column)}`
        }`,
    )
    .join(", ");

  const conflictClause =
    client.dialect === "mysql"
      ? `ON DUPLICATE KEY UPDATE ${updateColumns}`
      : `ON CONFLICT (${q("plan_id")}, ${q("chunk_no")}) DO UPDATE SET ${updateColumns}`;

  await client.query(
    `INSERT INTO ${tableRef} (${columnsSql}) VALUES (${placeholdersSql}) ${conflictClause}`,
    values,
  );
}

export async function listFailedFieldCryptoMigrationChunks(
  client: CloudflareSqlClient,
  planId: string,
  options: FieldCryptoMigrationStateTables = {},
): Promise<FieldCryptoMigrationChunkRecord[]> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(tables.chunksTableName);
  const p1 = placeholder(client.dialect, 1);
  const p2 = placeholder(client.dialect, 2);

  const { rows } = await client.query<MigrationRow>(
    `SELECT * FROM ${tableRef} WHERE ${q("plan_id")} = ${p1} AND ${q("status")} = ${p2} ORDER BY ${q("chunk_no")} ASC`,
    [planId, "failed"],
  );
  return rows.map((row) => toChunkRecord(row));
}

export async function getFieldCryptoMigrationStatus(
  client: CloudflareSqlClient,
  planId: string,
  options: FieldCryptoMigrationStateTables = {},
): Promise<FieldCryptoMigrationStatus> {
  const tables = resolveStateTables(options);
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(tables.chunksTableName);
  const p1 = placeholder(client.dialect, 1);

  const run = await getFieldCryptoMigrationRun(client, planId, options);
  const { rows } = await client.query<MigrationRow>(
    `SELECT ${q("status")} as status, COUNT(1) as count FROM ${tableRef} WHERE ${q("plan_id")} = ${p1} GROUP BY ${q("status")}`,
    [planId],
  );

  const chunks = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  for (const row of rows) {
    const status = toStringValue(row.status);
    const count = toNumber(row.count);
    if (!status) continue;
    if (status === "pending") chunks.pending += count;
    if (status === "processing") chunks.processing += count;
    if (status === "completed") chunks.completed += count;
    if (status === "failed") chunks.failed += count;
    chunks.total += count;
  }

  return {
    run,
    chunks,
    updatedAt: run?.updatedAt,
  };
}
