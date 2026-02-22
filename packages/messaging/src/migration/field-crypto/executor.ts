import {
  type DeliveryTrackingSchemaSpec,
  getDeliveryTrackingSchemaSpec,
} from "../../adapters/cloudflare/delivery-tracking-schema";
import type {
  CloudflareSqlClient,
  SqlDialect,
} from "../../adapters/cloudflare/sql-client";
import {
  ensureFieldCryptoMigrationStateTables,
  getFieldCryptoMigrationRun,
  getFieldCryptoMigrationStatus,
  listFailedFieldCryptoMigrationChunks,
  upsertFieldCryptoMigrationChunk,
  upsertFieldCryptoMigrationRun,
} from "./state";
import type {
  FieldCryptoMigrationApplyInput,
  FieldCryptoMigrationApplyResult,
  FieldCryptoMigrationChunkRecord,
  FieldCryptoMigrationRetryInput,
  FieldCryptoMigrationRunRecord,
  FieldCryptoMigrationStatus,
} from "./types";

interface MigrationCursor {
  requestedAt?: number;
  messageId?: string;
}

interface TrackingCursorRow {
  messageId: string;
  requestedAt: number;
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

function toStringValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

function normalizeMaxChunks(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.max(1, Math.floor(value));
}

function resolveSpec(
  trackingTableName: string | undefined,
  fieldCryptoSchema: FieldCryptoMigrationApplyInput["fieldCryptoSchema"],
): DeliveryTrackingSchemaSpec {
  return getDeliveryTrackingSchemaSpec({
    tableName: trackingTableName,
    fieldCryptoSchema: fieldCryptoSchema ?? {
      enabled: true,
      mode: "secure",
      compatPlainColumns: true,
    },
  });
}

async function selectNextRows(
  client: CloudflareSqlClient,
  spec: DeliveryTrackingSchemaSpec,
  cursor: MigrationCursor,
  limit: number,
): Promise<TrackingCursorRow[]> {
  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(spec.tableName);
  const requestedAtColumn = q(spec.columnMap.requestedAt);
  const messageIdColumn = q(spec.columnMap.messageId);

  const params: unknown[] = [];
  const where: string[] = [];
  if (
    typeof cursor.requestedAt === "number" &&
    typeof cursor.messageId === "string" &&
    cursor.messageId.length > 0
  ) {
    const p1 = placeholder(client.dialect, params.length + 1);
    params.push(cursor.requestedAt);
    const p2 = placeholder(client.dialect, params.length + 1);
    params.push(cursor.messageId);
    where.push(
      `(${requestedAtColumn} > ${p1} OR (${requestedAtColumn} = ${p1} AND ${messageIdColumn} > ${p2}))`,
    );
  }

  const limitPlaceholder = placeholder(client.dialect, params.length + 1);
  params.push(limit);

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const { rows } = await client.query<Record<string, unknown>>(
    `SELECT ${messageIdColumn} as messageId, ${requestedAtColumn} as requestedAt FROM ${tableRef} ${whereSql} ORDER BY ${requestedAtColumn} ASC, ${messageIdColumn} ASC LIMIT ${limitPlaceholder}`,
    params,
  );

  return rows
    .map((row) => ({
      messageId: String(row.messageId ?? ""),
      requestedAt: toNumber(row.requestedAt),
    }))
    .filter((row) => row.messageId.length > 0);
}

async function backfillChunkByMessageIds(
  client: CloudflareSqlClient,
  spec: DeliveryTrackingSchemaSpec,
  messageIds: readonly string[],
): Promise<void> {
  if (messageIds.length === 0) return;

  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(spec.tableName);
  const columns = spec.columnMap;
  const idPlaceholders = placeholders(client.dialect, messageIds.length).join(
    ", ",
  );
  const assignments = [
    `${q(columns.toEnc)} = COALESCE(${q(columns.toEnc)}, ${q(columns.to)})`,
    `${q(columns.toHash)} = COALESCE(${q(columns.toHash)}, ${q(columns.to)})`,
    `${q(columns.toMasked)} = COALESCE(${q(columns.toMasked)}, ${q(columns.to)})`,
    `${q(columns.fromEnc)} = COALESCE(${q(columns.fromEnc)}, ${q(columns.from)})`,
    `${q(columns.fromHash)} = COALESCE(${q(columns.fromHash)}, ${q(columns.from)})`,
    `${q(columns.fromMasked)} = COALESCE(${q(columns.fromMasked)}, ${q(columns.from)})`,
    `${q(columns.cryptoVersion)} = COALESCE(${q(columns.cryptoVersion)}, 1)`,
    `${q(columns.cryptoState)} = COALESCE(${q(columns.cryptoState)}, 'degraded')`,
  ];

  await client.query(
    `UPDATE ${tableRef} SET ${assignments.join(", ")} WHERE ${q(columns.messageId)} IN (${idPlaceholders})`,
    messageIds,
  );
}

export async function applyFieldCryptoMigration(
  client: CloudflareSqlClient,
  options: FieldCryptoMigrationApplyInput,
): Promise<FieldCryptoMigrationApplyResult> {
  await ensureFieldCryptoMigrationStateTables(client, options);

  const run = await getFieldCryptoMigrationRun(client, options.planId, options);
  if (!run) {
    throw new Error(`Migration plan not found: ${options.planId}`);
  }

  const spec = resolveSpec(
    options.trackingTableName ?? run.trackingTableName,
    options.fieldCryptoSchema,
  );
  const maxChunks = normalizeMaxChunks(options.maxChunks);
  const nextRun: FieldCryptoMigrationRunRecord = {
    ...run,
    status: "running",
    updatedAt: Date.now(),
    lastError: undefined,
  };
  await upsertFieldCryptoMigrationRun(client, nextRun, options);

  let processedChunks = 0;
  let processedRows = 0;
  let failedChunks = run.failedChunks;
  let cursorRequestedAt = run.cursorRequestedAt;
  let cursorMessageId = run.cursorMessageId;
  let chunkNo = run.processedChunks + run.failedChunks;

  while (processedChunks < maxChunks) {
    const rows = await selectNextRows(
      client,
      spec,
      {
        requestedAt: cursorRequestedAt,
        messageId: cursorMessageId,
      },
      run.chunkSize,
    );

    if (rows.length === 0) {
      break;
    }

    chunkNo += 1;
    const start = rows[0];
    const end = rows[rows.length - 1];
    const messageIds = rows.map((row) => row.messageId);

    await upsertFieldCryptoMigrationChunk(
      client,
      {
        planId: run.planId,
        chunkNo,
        status: "processing",
        startRequestedAt: start?.requestedAt,
        startMessageId: start?.messageId,
        endRequestedAt: end?.requestedAt,
        endMessageId: end?.messageId,
        processedRows: 0,
        attempts: 1,
        messageIds,
        updatedAt: Date.now(),
      },
      options,
    );

    try {
      await backfillChunkByMessageIds(client, spec, messageIds);
      await upsertFieldCryptoMigrationChunk(
        client,
        {
          planId: run.planId,
          chunkNo,
          status: "completed",
          startRequestedAt: start?.requestedAt,
          startMessageId: start?.messageId,
          endRequestedAt: end?.requestedAt,
          endMessageId: end?.messageId,
          processedRows: rows.length,
          attempts: 1,
          messageIds,
          updatedAt: Date.now(),
        },
        options,
      );

      processedChunks += 1;
      processedRows += rows.length;
      cursorRequestedAt = end?.requestedAt;
      cursorMessageId = end?.messageId;
    } catch (error) {
      failedChunks += 1;
      await upsertFieldCryptoMigrationChunk(
        client,
        {
          planId: run.planId,
          chunkNo,
          status: "failed",
          startRequestedAt: start?.requestedAt,
          startMessageId: start?.messageId,
          endRequestedAt: end?.requestedAt,
          endMessageId: end?.messageId,
          processedRows: 0,
          attempts: 1,
          messageIds,
          lastError: toErrorMessage(error),
          updatedAt: Date.now(),
        },
        options,
      );

      await upsertFieldCryptoMigrationRun(
        client,
        {
          ...run,
          status: "failed",
          failedChunks,
          processedChunks: run.processedChunks + processedChunks,
          processedRows: run.processedRows + processedRows,
          cursorRequestedAt,
          cursorMessageId,
          updatedAt: Date.now(),
          lastError: toErrorMessage(error),
        },
        options,
      );

      return {
        planId: run.planId,
        processedChunks,
        processedRows,
        failedChunks,
        status: "failed",
        cursorRequestedAt,
        cursorMessageId,
      };
    }
  }

  const hasMore =
    (
      await selectNextRows(
        client,
        spec,
        {
          requestedAt: cursorRequestedAt,
          messageId: cursorMessageId,
        },
        1,
      )
    ).length > 0;

  const finalStatus = hasMore ? "running" : "completed";
  await upsertFieldCryptoMigrationRun(
    client,
    {
      ...run,
      status: finalStatus,
      failedChunks,
      processedChunks: run.processedChunks + processedChunks,
      processedRows: run.processedRows + processedRows,
      cursorRequestedAt,
      cursorMessageId,
      updatedAt: Date.now(),
      lastError: undefined,
    },
    options,
  );

  return {
    planId: run.planId,
    processedChunks,
    processedRows,
    failedChunks,
    status: finalStatus,
    cursorRequestedAt,
    cursorMessageId,
  };
}

export async function retryFieldCryptoMigration(
  client: CloudflareSqlClient,
  options: FieldCryptoMigrationRetryInput,
): Promise<FieldCryptoMigrationApplyResult> {
  await ensureFieldCryptoMigrationStateTables(client, options);
  const run = await getFieldCryptoMigrationRun(client, options.planId, options);
  if (!run) {
    throw new Error(`Migration plan not found: ${options.planId}`);
  }

  const spec = resolveSpec(
    options.trackingTableName ?? run.trackingTableName,
    options.fieldCryptoSchema,
  );
  const failedChunks = await listFailedFieldCryptoMigrationChunks(
    client,
    run.planId,
    options,
  );
  const maxChunks = normalizeMaxChunks(options.maxChunks);

  let retriedChunks = 0;
  let processedRows = 0;
  let remainingFailed = run.failedChunks;

  for (const chunk of failedChunks) {
    if (retriedChunks >= maxChunks) break;
    const messageIds = Array.isArray(chunk.messageIds) ? chunk.messageIds : [];
    if (messageIds.length === 0) continue;

    try {
      await backfillChunkByMessageIds(client, spec, messageIds);
      await upsertFieldCryptoMigrationChunk(
        client,
        {
          ...chunk,
          status: "completed",
          processedRows: messageIds.length,
          attempts: chunk.attempts + 1,
          updatedAt: Date.now(),
          lastError: undefined,
        },
        options,
      );
      retriedChunks += 1;
      processedRows += messageIds.length;
      remainingFailed = Math.max(0, remainingFailed - 1);
    } catch (error) {
      await upsertFieldCryptoMigrationChunk(
        client,
        {
          ...chunk,
          status: "failed",
          attempts: chunk.attempts + 1,
          updatedAt: Date.now(),
          lastError: toErrorMessage(error),
        },
        options,
      );
    }
  }

  const status: FieldCryptoMigrationApplyResult["status"] =
    remainingFailed > 0 ? "failed" : "running";

  await upsertFieldCryptoMigrationRun(
    client,
    {
      ...run,
      status,
      failedChunks: remainingFailed,
      processedRows: run.processedRows + processedRows,
      processedChunks: run.processedChunks + retriedChunks,
      updatedAt: Date.now(),
      lastError: remainingFailed > 0 ? run.lastError : undefined,
    },
    options,
  );

  return {
    planId: run.planId,
    processedChunks: retriedChunks,
    processedRows,
    failedChunks: remainingFailed,
    status,
    cursorRequestedAt: run.cursorRequestedAt,
    cursorMessageId: run.cursorMessageId,
  };
}

export async function statusFieldCryptoMigration(
  client: CloudflareSqlClient,
  planId: string,
  options: FieldCryptoMigrationApplyInput,
): Promise<FieldCryptoMigrationStatus> {
  await ensureFieldCryptoMigrationStateTables(client, options);
  return getFieldCryptoMigrationStatus(client, planId, options);
}
