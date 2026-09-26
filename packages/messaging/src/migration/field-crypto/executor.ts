import {
  type DeliveryTrackingSchemaSpec,
  getDeliveryTrackingSchemaSpec,
} from "../../adapters/cloudflare/delivery-tracking-schema";
import type {
  CloudflareSqlClient,
  SqlDialect,
} from "../../adapters/cloudflare/sql-client";
import {
  applyTrackingCryptoOnWrite,
  type TrackingCryptoWriteInput,
} from "../../delivery-tracking/field-crypto";
import type { DeliveryTrackingFieldCryptoOptions } from "../../delivery-tracking/store.interface";
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
  FieldCryptoMigrationStateTables,
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

// Returns the stored string unchanged when it is non-empty: the backfill must
// encrypt exactly what the plain column holds, as the store's write path does.
function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

// `?` placeholders need the dialect's null-safe equality to compare a column
// with a value that may be NULL.
function nullSafeEquals(
  dialect: SqlDialect,
  column: string,
  valuePlaceholder: string,
): string {
  if (dialect === "postgres") {
    return `${column} IS NOT DISTINCT FROM ${valuePlaceholder}`;
  }
  if (dialect === "mysql") return `${column} <=> ${valuePlaceholder}`;
  return `${column} IS ${valuePlaceholder}`;
}

// Reads a column as text in every dialect, so a JSON column is compared with
// the exact text it was read as.
function asText(dialect: SqlDialect, column: string): string {
  return `CAST(${column} AS ${dialect === "mysql" ? "CHAR" : "TEXT"})`;
}

const MAX_BACKFILL_ATTEMPTS = 3;

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
    // `?` placeholders are positional, so the repeated cursor value is bound
    // twice rather than reusing one placeholder.
    const afterRequestedAt = placeholder(client.dialect, params.length + 1);
    params.push(cursor.requestedAt);
    const sameRequestedAt = placeholder(client.dialect, params.length + 1);
    params.push(cursor.requestedAt);
    const afterMessageId = placeholder(client.dialect, params.length + 1);
    params.push(cursor.messageId);
    where.push(
      `(${requestedAtColumn} > ${afterRequestedAt} OR (${requestedAtColumn} = ${sameRequestedAt} AND ${messageIdColumn} > ${afterMessageId}))`,
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

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || value.length === 0) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function requireFieldCrypto(
  fieldCrypto: DeliveryTrackingFieldCryptoOptions | undefined,
): DeliveryTrackingFieldCryptoOptions {
  if (!fieldCrypto) {
    throw new Error(
      "fieldCrypto is required: the backfill encrypts legacy plaintext with the provider and keys the tracking store uses",
    );
  }
  return fieldCrypto;
}

// Encrypts rows that were never protected (crypto_state NULL or "plain") or
// were left degraded, reading the legacy plaintext columns and writing the
// same secure columns the tracking store's write path produces.
async function backfillChunkByMessageIds(
  client: CloudflareSqlClient,
  spec: DeliveryTrackingSchemaSpec,
  messageIds: readonly string[],
  fieldCrypto: DeliveryTrackingFieldCryptoOptions,
): Promise<void> {
  if (messageIds.length === 0) return;

  const q = (name: string) => quoteIdentifier(client.dialect, name);
  const tableRef = q(spec.tableName);
  const columns = spec.columnMap;
  const idPlaceholders = placeholders(client.dialect, messageIds.length).join(
    ", ",
  );
  // The read and the guarded write must agree on which rows still need
  // encryption, or rows read here could be skipped by the write below.
  const stillMigratable = `(${q(columns.cryptoState)} IS NULL OR ${q(columns.cryptoState)} IN ('plain', 'degraded'))`;
  const metadataText = asText(client.dialect, q(columns.metadata));
  const selectColumns = `${q(columns.messageId)} AS message_id, ${q(columns.providerId)} AS provider_id, ${q(columns.to)} AS to_plain, ${q(columns.from)} AS from_plain, ${metadataText} AS metadata_plain, ${q(columns.cryptoState)} AS crypto_state`;
  const { rows } = await client.query<Record<string, unknown>>(
    `SELECT ${selectColumns} FROM ${tableRef} WHERE ${q(columns.messageId)} IN (${idPlaceholders}) AND ${stillMigratable}`,
    messageIds,
  );

  for (const first of rows) {
    let row: Record<string, unknown> | undefined = first;
    for (let attempt = 1; row; attempt += 1) {
      const updated = await encryptRow(row);
      if (updated !== undefined && updated > 0) break;
      // No affected row reported: either another writer changed the row
      // after it was read, or the client does not report a count. Re-read
      // it; a row that is no longer plain or degraded is protected.
      const messageId: unknown = row.message_id;
      const { rows: current } = await client.query<Record<string, unknown>>(
        `SELECT ${selectColumns} FROM ${tableRef} WHERE ${q(columns.messageId)} = ${placeholder(client.dialect, 1)} AND ${stillMigratable}`,
        [messageId],
      );
      row = current[0];
      if (row && attempt >= MAX_BACKFILL_ATTEMPTS) {
        throw new Error(
          `Message ${String(messageId)} kept changing during the backfill; retry the chunk`,
        );
      }
    }
  }

  // Returns the number of rows the guarded write reports, when it reports one.
  async function encryptRow(
    row: Record<string, unknown>,
  ): Promise<number | undefined> {
    const messageId = String(row.message_id ?? "");
    const to = nonEmptyString(row.to_plain);
    if (!to) {
      // Skipping would mark the chunk completed and leave the row unprotected.
      throw new Error(
        `Cannot encrypt message ${messageId}: its plain recipient column is empty, so there is no plaintext to encrypt`,
      );
    }

    const record: TrackingCryptoWriteInput = {
      messageId,
      providerId: String(row.provider_id ?? ""),
      to,
      from: nonEmptyString(row.from_plain),
      metadata: parseMetadata(row.metadata_plain),
    };
    const secured = await applyTrackingCryptoOnWrite(
      record,
      fieldCrypto,
      { tableName: spec.tableName, store: "sql" },
      { secureMode: true, compatPlainColumns: true },
    );
    if (secured.cryptoState !== "encrypted") {
      throw new Error(
        `Field crypto did not encrypt message ${messageId} (state: ${secured.cryptoState ?? "unknown"}); refusing to store fallback values`,
      );
    }

    const values: Array<[string, unknown]> = [
      [columns.toEnc, secured.toEnc ?? null],
      [columns.toHash, secured.toHash ?? null],
      [columns.toMasked, secured.toMasked ?? null],
      [columns.fromEnc, secured.fromEnc ?? null],
      [columns.fromHash, secured.fromHash ?? null],
      [columns.fromMasked, secured.fromMasked ?? null],
      [columns.metadataEnc, secured.metadataEnc ?? null],
      [
        columns.metadataHashes,
        secured.metadataHashes ? JSON.stringify(secured.metadataHashes) : null,
      ],
      [columns.cryptoKid, secured.cryptoKid ?? null],
      [columns.cryptoVersion, secured.cryptoVersion ?? 1],
      [columns.cryptoState, secured.cryptoState],
    ];
    const at = (offset: number) =>
      placeholder(client.dialect, values.length + offset);
    const assignments = values.map(
      ([column], index) =>
        `${q(column)} = ${placeholder(client.dialect, index + 1)}`,
    );
    // Write only if the row still holds every value this ciphertext was
    // derived from: its state, recipient, sender, provider (part of the
    // default AAD), and metadata. A live writer may have changed any of them
    // since the row was read.
    const guards: Array<[string, unknown]> = [
      [q(columns.cryptoState), row.crypto_state ?? null],
      [q(columns.to), row.to_plain ?? null],
      [q(columns.from), row.from_plain ?? null],
      [q(columns.providerId), row.provider_id ?? null],
      [metadataText, row.metadata_plain ?? null],
    ];
    const guardSql = guards
      .map(([column], index) =>
        nullSafeEquals(client.dialect, column, at(index + 2)),
      )
      .join(" AND ");
    const result = await client.query(
      `UPDATE ${tableRef} SET ${assignments.join(", ")} WHERE ${q(columns.messageId)} = ${at(1)} AND ${guardSql}`,
      [
        ...values.map(([, value]) => value),
        messageId,
        ...guards.map(([, value]) => value),
      ],
    );
    return result.rowCount;
  }
}

export async function applyFieldCryptoMigration(
  client: CloudflareSqlClient,
  options: FieldCryptoMigrationApplyInput,
): Promise<FieldCryptoMigrationApplyResult> {
  const fieldCrypto = requireFieldCrypto(options.fieldCrypto);
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

  const failRun = async (
    error: unknown,
  ): Promise<FieldCryptoMigrationApplyResult> => {
    // Best effort: when the database is what failed, recording the failure
    // may fail too, and the caller must still get the failed result. Encrypted
    // rows are skipped when `apply` re-reads them.
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
    ).catch(() => undefined);

    return {
      planId: run.planId,
      processedChunks,
      processedRows,
      failedChunks,
      status: "failed",
      cursorRequestedAt,
      cursorMessageId,
    };
  };

  // Any read or state write that fails stops the run as failed. Rows up to the
  // recorded cursor are done, so `apply` resumes from there.
  try {
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
        await backfillChunkByMessageIds(client, spec, messageIds, fieldCrypto);
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
        // Best effort: the run must report the backfill error, not a failed
        // bookkeeping write. A chunk left "processing" is re-read by `apply`,
        // whose cursor has not moved past it.
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
        ).catch(() => undefined);
        throw error;
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
  } catch (error) {
    return failRun(error);
  }
}

export async function retryFieldCryptoMigration(
  client: CloudflareSqlClient,
  options: FieldCryptoMigrationRetryInput,
): Promise<FieldCryptoMigrationApplyResult> {
  const fieldCrypto = requireFieldCrypto(options.fieldCrypto);
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
  if (failedChunks.length === 0) {
    // Only failed chunks are retried. A run that stopped on a read error has
    // none and resumes from its cursor with `apply`, so leave it as it is.
    const unchanged: FieldCryptoMigrationApplyResult = {
      planId: run.planId,
      processedChunks: 0,
      processedRows: 0,
      failedChunks: run.failedChunks,
      status: run.status,
      cursorRequestedAt: run.cursorRequestedAt,
      cursorMessageId: run.cursorMessageId,
    };
    if (run.failedChunks === 0) return unchanged;

    // The run still counts failed chunks that an earlier retry completed but
    // could not record; reconcile it so `apply` can continue.
    const status = run.status === "failed" ? "running" : run.status;
    const recorded = await upsertFieldCryptoMigrationRun(
      client,
      {
        ...run,
        status,
        failedChunks: 0,
        updatedAt: Date.now(),
        lastError: undefined,
      },
      options,
    ).then(
      () => true,
      () => false,
    );
    return recorded ? { ...unchanged, failedChunks: 0, status } : unchanged;
  }
  const maxChunks = normalizeMaxChunks(options.maxChunks);

  let retriedChunks = 0;
  let processedRows = 0;
  let remainingFailed = run.failedChunks;

  for (const chunk of failedChunks) {
    if (retriedChunks >= maxChunks) break;
    const messageIds = Array.isArray(chunk.messageIds) ? chunk.messageIds : [];
    if (messageIds.length === 0) continue;

    try {
      await backfillChunkByMessageIds(client, spec, messageIds, fieldCrypto);
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
      // Best effort, as in apply: the chunk is already recorded as failed.
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
      ).catch(() => undefined);
    }
  }

  const status: FieldCryptoMigrationApplyResult["status"] =
    remainingFailed > 0 ? "failed" : "running";

  // When the run state cannot be recorded, report the retry as failed so it
  // is run again; chunks it completed are skipped then.
  const recorded = await upsertFieldCryptoMigrationRun(
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
  ).then(
    () => true,
    () => false,
  );

  return {
    planId: run.planId,
    processedChunks: retriedChunks,
    processedRows,
    failedChunks: remainingFailed,
    status: recorded ? status : "failed",
    cursorRequestedAt: run.cursorRequestedAt,
    cursorMessageId: run.cursorMessageId,
  };
}

export async function statusFieldCryptoMigration(
  client: CloudflareSqlClient,
  planId: string,
  options: FieldCryptoMigrationStateTables,
): Promise<FieldCryptoMigrationStatus> {
  await ensureFieldCryptoMigrationStateTables(client, options);
  return getFieldCryptoMigrationStatus(client, planId, options);
}
