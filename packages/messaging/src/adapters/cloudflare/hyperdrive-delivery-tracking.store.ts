import {
  assertFieldCryptoConfig,
  FieldCryptoError,
  KMSG_TERMINAL_STATUSES,
} from "@k-msg/core";
import {
  applyTrackingCryptoOnWrite,
  normalizeTrackingFilterWithHashes,
  restoreTrackingCryptoOnRead,
  type TrackingCryptoColumns,
  type TrackingCryptoMode,
} from "../../delivery-tracking/field-crypto";
import {
  resolveRetentionDays,
  toRetentionBucketYm,
} from "../../delivery-tracking/retention";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingFieldCryptoOptions,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingRetentionConfig,
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
import {
  type CloudflareSqlClient,
  runCloudflareSqlTransaction,
  type SqlDialect,
} from "./sql-client";
import {
  jsonParameterSql,
  readJsonColumn,
  readJsonObjectColumn,
  selectJsonAsTextSql,
  toJsonText,
} from "./sql-json";
import { initializeCloudflareSqlSchema } from "./sql-schema";

type TrackingRow = Record<string, unknown>;

// D1 binds at most 100 parameters per statement.
const RELEASE_BATCH_SIZE = 50;

type WhereSql = {
  sql: string;
  params: unknown[];
};

const JSON_COLUMN_KEYS: ReadonlySet<DeliveryTrackingColumnKey> = new Set([
  "lastError",
  "raw",
  "metadata",
  "metadataHashes",
]);

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

export interface HyperdriveDeliveryTrackingStoreConfig
  extends DeliveryTrackingSchemaOptions {
  fieldCrypto?: DeliveryTrackingFieldCryptoOptions;
  retention?: DeliveryTrackingRetentionConfig;
  /**
   * Whether `init()` creates the table and indexes (`IF NOT EXISTS`). Each
   * new store runs those statements before its first query, which in a
   * Worker means every request. Set it to `false` when migrations create the
   * schema, for example from `buildDeliveryTrackingSchemaSql()`.
   * @default true
   */
  initializeSchema?: boolean;
}

export type HyperdriveDeliveryTrackingStoreOptions =
  | string
  | HyperdriveDeliveryTrackingStoreConfig;

export class HyperdriveDeliveryTrackingStore implements DeliveryTrackingStore {
  private initPromise: Promise<void> | undefined;
  private readonly schema: DeliveryTrackingSchemaSpec;
  private readonly fieldCrypto?: DeliveryTrackingFieldCryptoOptions;
  private readonly retention?: DeliveryTrackingRetentionConfig;
  private readonly initializeSchema: boolean;

  constructor(
    private readonly client: CloudflareSqlClient,
    options: HyperdriveDeliveryTrackingStoreOptions = {},
  ) {
    const resolved =
      typeof options === "string" ? { tableName: options } : options;
    const fieldCryptoSchema =
      resolved.fieldCryptoSchema ??
      (resolved.fieldCrypto
        ? {
            enabled: true,
            mode: "secure",
            compatPlainColumns: false,
          }
        : undefined);
    this.schema = getDeliveryTrackingSchemaSpec({
      ...resolved,
      fieldCryptoSchema,
    });
    this.fieldCrypto = resolved.fieldCrypto;
    this.retention = resolved.retention;
    this.initializeSchema = resolved.initializeSchema !== false;

    if (this.schema.fieldCrypto.enabled && !this.fieldCrypto?.config) {
      throw new FieldCryptoError(
        "config",
        "fieldCrypto config is required when fieldCryptoSchema is enabled",
        {
          rule: "fieldCrypto.schema_requires_config",
          path: "fieldCrypto",
          hint: "Provide fieldCrypto.config or disable fieldCryptoSchema",
        },
        {
          fieldPath: "fieldCrypto",
        },
      );
    }

    if (this.fieldCrypto?.config) {
      assertFieldCryptoConfig(this.fieldCrypto.config, {
        secureMode:
          this.schema.fieldCrypto.enabled &&
          this.schema.fieldCrypto.mode === "secure",
        compatPlainColumns: this.schema.fieldCrypto.compatPlainColumns,
      });
    }
  }

  async init(): Promise<void> {
    if (!this.initializeSchema) return;
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = initializeCloudflareSqlSchema(this.client, {
      target: "tracking",
      trackingTableName: this.schema.tableName,
      trackingColumnMap: this.schema.columnMap,
      trackingTypeStrategy: this.schema.typeStrategy,
      trackingStoreRaw: this.schema.storeRaw,
      fieldCryptoSchema: this.schema.fieldCrypto,
      trackingIndexNames: this.schema.indexNames,
    }).catch((error) => {
      this.initPromise = undefined;
      throw error;
    });

    return this.initPromise;
  }

  async upsert(record: TrackingRecord): Promise<void> {
    await this.init();

    const prepared = await this.prepareRecordForStorage(record);
    const keys = getDeliveryTrackingColumnKeys(this.schema);
    const values = keys.map((key) => this.recordValueForKey(prepared, key));

    const colSql = keys
      .map((key) => this.quoteIdentifier(this.columnName(key)))
      .join(", ");
    const valueSql = keys
      .map((key, index) => this.valueSql(key, this.placeholder(index + 1)))
      .join(", ");

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
      `SELECT ${this.selectListSql()} FROM ${this.tableRef()} WHERE ${this.quoteIdentifier(this.columnName("messageId"))} = ${messageIdPlaceholder} LIMIT 1`,
      [messageId],
    );
    const row = rows[0];
    return row ? await this.rowToRecord(row) : undefined;
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    await this.init();

    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    const statusPlaceholders = this.placeholders(
      KMSG_TERMINAL_STATUSES.length,
      1,
    );
    const nowPlaceholder = this.placeholder(KMSG_TERMINAL_STATUSES.length + 1);
    const limitPlaceholder = this.placeholder(
      KMSG_TERMINAL_STATUSES.length + 2,
    );

    const { rows } = await this.client.query<TrackingRow>(
      `SELECT ${this.selectListSql()} FROM ${this.tableRef()} WHERE ${this.quoteIdentifier(this.columnName("status"))} NOT IN (${statusPlaceholders.join(", ")}) AND ${this.quoteIdentifier(this.columnName("nextCheckAt"))} <= ${nowPlaceholder} ORDER BY ${this.quoteIdentifier(this.columnName("nextCheckAt"))} ASC LIMIT ${limitPlaceholder}`,
      [...KMSG_TERMINAL_STATUSES, this.toDbTimestamp(now), safeLimit],
    );

    return await Promise.all(rows.map((row) => this.rowToRecord(row)));
  }

  async leaseDue(
    now: Date,
    limit: number,
    leaseUntil: Date,
  ): Promise<TrackingRecord[] | undefined> {
    if (this.client.dialect === "mysql") {
      // Autocommitted, the locking read would release its rows before the
      // lease is written, and two polls could take the same ones.
      if (typeof this.client.transaction !== "function") return undefined;
    }
    await this.init();

    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    if (this.client.dialect === "mysql") {
      return await this.leaseDueInTransaction(now, safeLimit, leaseUntil);
    }

    const table = this.tableRef();
    const messageId = this.quoteIdentifier(this.columnName("messageId"));
    const status = this.quoteIdentifier(this.columnName("status"));
    const nextCheckAt = this.quoteIdentifier(this.columnName("nextCheckAt"));
    const statusPlaceholders = this.placeholders(
      KMSG_TERMINAL_STATUSES.length,
      2,
    );
    const nowPlaceholder = this.placeholder(KMSG_TERMINAL_STATUSES.length + 2);
    const limitPlaceholder = this.placeholder(
      KMSG_TERMINAL_STATUSES.length + 3,
    );
    // One statement selects and leases the rows. Postgres skips rows another
    // poll has locked instead of waiting for them; SQLite runs the whole
    // statement under its write lock.
    const lock =
      this.client.dialect === "postgres" ? " FOR UPDATE SKIP LOCKED" : "";

    const { rows } = await this.client.query<TrackingRow>(
      `UPDATE ${table} SET ${nextCheckAt} = ${this.placeholder(1)} WHERE ${messageId} IN (SELECT ${messageId} FROM ${table} WHERE ${status} NOT IN (${statusPlaceholders.join(", ")}) AND ${nextCheckAt} <= ${nowPlaceholder} ORDER BY ${nextCheckAt} ASC LIMIT ${limitPlaceholder}${lock}) RETURNING ${this.selectListSql()}`,
      [
        this.toDbTimestamp(leaseUntil),
        ...KMSG_TERMINAL_STATUSES,
        this.toDbTimestamp(now),
        safeLimit,
      ],
    );

    return await Promise.all(rows.map((row) => this.rowToRecord(row)));
  }

  async releaseLeases(
    messageIds: readonly string[],
    leaseUntil: Date,
    nextCheckAt: Date,
  ): Promise<void> {
    await this.init();

    const table = this.tableRef();
    const messageId = this.quoteIdentifier(this.columnName("messageId"));
    const nextCheckAtColumn = this.quoteIdentifier(
      this.columnName("nextCheckAt"),
    );
    for (
      let start = 0;
      start < messageIds.length;
      start += RELEASE_BATCH_SIZE
    ) {
      const batch = messageIds.slice(start, start + RELEASE_BATCH_SIZE);
      // Only rows still under this lease: another poll may hold one now.
      await this.client.query(
        `UPDATE ${table} SET ${nextCheckAtColumn} = ${this.placeholder(1)} WHERE ${nextCheckAtColumn} = ${this.placeholder(2)} AND ${messageId} IN (${this.placeholders(batch.length, 3).join(", ")})`,
        [
          this.toDbTimestamp(nextCheckAt),
          this.toDbTimestamp(leaseUntil),
          ...batch,
        ],
      );
    }
  }

  // MySQL has no UPDATE ... RETURNING. The locking read holds the rows, in
  // the client's transaction, until the lease is written.
  private async leaseDueInTransaction(
    now: Date,
    limit: number,
    leaseUntil: Date,
  ): Promise<TrackingRecord[]> {
    const table = this.tableRef();
    const messageIdColumn = this.columnName("messageId");
    const nextCheckAtColumn = this.columnName("nextCheckAt");
    const status = this.quoteIdentifier(this.columnName("status"));
    const nextCheckAt = this.quoteIdentifier(nextCheckAtColumn);
    const leasedAt = this.toDbTimestamp(leaseUntil);

    const rows = await runCloudflareSqlTransaction(this.client, async (tx) => {
      const { rows: due } = await tx.query<TrackingRow>(
        `SELECT ${this.selectListSql()} FROM ${table} WHERE ${status} NOT IN (${this.placeholders(KMSG_TERMINAL_STATUSES.length).join(", ")}) AND ${nextCheckAt} <= ? ORDER BY ${nextCheckAt} ASC LIMIT ? FOR UPDATE`,
        [...KMSG_TERMINAL_STATUSES, this.toDbTimestamp(now), limit],
      );
      if (due.length === 0) return due;

      await tx.query(
        `UPDATE ${table} SET ${nextCheckAt} = ? WHERE ${this.quoteIdentifier(messageIdColumn)} IN (${this.placeholders(due.length).join(", ")})`,
        [leasedAt, ...due.map((row) => row[messageIdColumn])],
      );
      return due.map((row) => ({ ...row, [nextCheckAtColumn]: leasedAt }));
    });

    return await Promise.all(rows.map((row) => this.rowToRecord(row)));
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

    const normalizedFilter = await this.normalizeFilterForCrypto(options);
    if (!normalizedFilter) return [];
    const where = this.buildWhere(normalizedFilter);
    const orderBy =
      options.orderBy === "statusUpdatedAt"
        ? this.columnName("statusUpdatedAt")
        : this.columnName("requestedAt");
    const direction = options.orderDirection === "asc" ? "ASC" : "DESC";

    const params = [...where.params, safeLimit, safeOffset];
    const limitPlaceholder = this.placeholder(where.params.length + 1);
    const offsetPlaceholder = this.placeholder(where.params.length + 2);

    const { rows } = await this.client.query<TrackingRow>(
      `SELECT ${this.selectListSql()} FROM ${this.tableRef()} ${where.sql} ORDER BY ${this.quoteIdentifier(orderBy)} ${direction} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      params,
    );

    return await Promise.all(rows.map((row) => this.rowToRecord(row)));
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    await this.init();

    const normalizedFilter = await this.normalizeFilterForCrypto(filter);
    if (!normalizedFilter) return 0;
    const where = this.buildWhere(normalizedFilter);
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

    const normalizedFilter = await this.normalizeFilterForCrypto(filter);
    if (!normalizedFilter) return [];
    const where = this.buildWhere(normalizedFilter);

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

    if (this.patchTouchesCrypto(patch)) {
      const current = await this.get(messageId);
      if (!current) return;
      const merged: TrackingRecord = {
        ...current,
        ...patch,
        messageId: current.messageId,
      };
      await this.upsert(merged);
      return;
    }

    const updates = this.patchColumns(patch);
    if (updates.length === 0) return;

    await this.client.query(
      `UPDATE ${this.tableRef()} SET ${this.setClauseSql(updates)} WHERE ${this.quoteIdentifier(this.columnName("messageId"))} = ${this.placeholder(updates.length + 1)}`,
      [...updates.map((update) => update.value), messageId],
    );
  }

  async patchLeased(
    messageId: string,
    leaseUntil: Date,
    patch: Partial<TrackingRecord>,
  ): Promise<boolean> {
    await this.init();

    const table = this.tableRef();
    const messageIdColumn = this.quoteIdentifier(this.columnName("messageId"));
    const nextCheckAtColumn = this.quoteIdentifier(
      this.columnName("nextCheckAt"),
    );
    // Encrypted fields are rewritten from the whole record, so such a patch
    // writes the stored record with the patch applied.
    const rewrite = this.patchTouchesCrypto(patch);

    if (this.client.dialect === "mysql") {
      // Autocommitted, the locking read would release the row before the
      // write.
      if (typeof this.client.transaction !== "function") {
        throw new Error(
          "patchLeased on MySQL needs a CloudflareSqlClient with transaction()",
        );
      }
      // No UPDATE ... RETURNING: read the lease under a lock, then write.
      return await runCloudflareSqlTransaction(this.client, async (tx) => {
        const { rows } = await tx.query<TrackingRow>(
          `SELECT ${rewrite ? this.selectListSql() : nextCheckAtColumn} FROM ${table} WHERE ${messageIdColumn} = ? FOR UPDATE`,
          [messageId],
        );
        const row = rows[0];
        const current = toDate(row?.[this.columnName("nextCheckAt")]);
        if (!row || current?.getTime() !== leaseUntil.getTime()) return false;
        const updates = rewrite
          ? await this.recordColumns({
              ...(await this.rowToRecord(row)),
              ...patch,
              messageId,
            })
          : this.patchColumns(patch);
        if (updates.length > 0) {
          await tx.query(
            `UPDATE ${table} SET ${this.setClauseSql(updates)} WHERE ${messageIdColumn} = ?`,
            [...updates.map((update) => update.value), messageId],
          );
        }
        return true;
      });
    }

    let updates = this.patchColumns(patch);
    if (rewrite) {
      const current = await this.get(messageId);
      if (current?.nextCheckAt.getTime() !== leaseUntil.getTime()) {
        return false;
      }
      // The write checks the lease again: another poll may lease the record
      // while this one reads and encrypts it.
      updates = await this.recordColumns({
        ...current,
        ...patch,
        messageId: current.messageId,
      });
    }

    if (updates.length === 0) {
      const current = await this.get(messageId);
      return current?.nextCheckAt.getTime() === leaseUntil.getTime();
    }
    const { rows } = await this.client.query<TrackingRow>(
      `UPDATE ${table} SET ${this.setClauseSql(updates)} WHERE ${messageIdColumn} = ${this.placeholder(updates.length + 1)} AND ${nextCheckAtColumn} = ${this.placeholder(updates.length + 2)} RETURNING ${messageIdColumn}`,
      [
        ...updates.map((update) => update.value),
        messageId,
        this.toDbTimestamp(leaseUntil),
      ],
    );
    return rows.length > 0;
  }

  // The columns a patch sets, with their database values.
  private patchColumns(
    patch: Partial<TrackingRecord>,
  ): Array<{ key: DeliveryTrackingColumnKey; value: unknown }> {
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
    if (patch.to !== undefined && this.hasPlainColumns()) {
      updates.push({ key: "to", value: patch.to });
    }
    if ("from" in patch && this.hasPlainColumns()) {
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
        value: patch.lastError ? this.jsonText(patch.lastError) : null,
      });
    }
    if (this.schema.storeRaw && "raw" in patch) {
      updates.push({
        key: "raw",
        value: patch.raw !== undefined ? this.jsonText(patch.raw) : null,
      });
    }
    if ("metadata" in patch) {
      updates.push({
        key: "metadata",
        value: patch.metadata ? this.jsonText(patch.metadata) : null,
      });
    }

    return updates;
  }

  // Every column of a record but its message id, with its database value,
  // encrypted as upsert() stores it.
  private async recordColumns(
    record: TrackingRecord,
  ): Promise<Array<{ key: DeliveryTrackingColumnKey; value: unknown }>> {
    const prepared = await this.prepareRecordForStorage(record);
    return getDeliveryTrackingColumnKeys(this.schema)
      .filter((key) => key !== "messageId")
      .map((key) => ({ key, value: this.recordValueForKey(prepared, key) }));
  }

  // `column = placeholder` for each update, numbered from 1.
  private setClauseSql(
    updates: Array<{ key: DeliveryTrackingColumnKey; value: unknown }>,
  ): string {
    return updates
      .map(
        (update, index) =>
          `${this.quoteIdentifier(this.columnName(update.key))} = ${this.valueSql(update.key, this.placeholder(index + 1))}`,
      )
      .join(", ");
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

  private async rowToRecord(row: TrackingRow): Promise<TrackingRecord> {
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
      to: this.hasPlainColumns() ? toStringValue(columnValue("to")) : "",
      requestedAt,
      status: toStringValue(columnValue("status")) as TrackingRecord["status"],
      statusUpdatedAt,
      attemptCount: toNumberValue(columnValue("attemptCount"), 0),
      nextCheckAt,
    };

    if (this.hasPlainColumns()) {
      const from = toStringValue(columnValue("from"));
      if (from.length > 0) record.from = from;
    }

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

    const lastError = readJsonObjectColumn(columnValue("lastError"));
    if (
      typeof lastError?.code === "string" &&
      typeof lastError.message === "string"
    ) {
      record.lastError = {
        ...lastError,
        code: lastError.code,
        message: lastError.message,
      };
    }

    if (this.schema.storeRaw) {
      const rawValue = columnValue("raw");
      const raw = readJsonColumn(rawValue);
      if (raw !== undefined) {
        record.raw = raw;
      } else if (typeof rawValue === "string" && rawValue.length > 0) {
        record.raw = rawValue;
      }
    }

    const metadataObject = readJsonObjectColumn(columnValue("metadata"));
    if (metadataObject) record.metadata = metadataObject;

    if (this.schema.fieldCrypto.enabled) {
      const metadataHashes = readJsonObjectColumn(
        columnValue("metadataHashes"),
      ) as Record<string, string> | undefined;
      const restored = await restoreTrackingCryptoOnRead(
        record,
        {
          toEnc: toStringValue(columnValue("toEnc")) || undefined,
          toHash: toStringValue(columnValue("toHash")) || undefined,
          toMasked: toStringValue(columnValue("toMasked")) || undefined,
          fromEnc: toStringValue(columnValue("fromEnc")) || undefined,
          fromHash: toStringValue(columnValue("fromHash")) || undefined,
          fromMasked: toStringValue(columnValue("fromMasked")) || undefined,
          metadataEnc: toStringValue(columnValue("metadataEnc")) || undefined,
          metadataHashes,
          metadata: metadataObject,
          cryptoKid: toStringValue(columnValue("cryptoKid")) || undefined,
          cryptoVersion:
            toNumberValue(columnValue("cryptoVersion"), 0) > 0
              ? toNumberValue(columnValue("cryptoVersion"), 0)
              : undefined,
          cryptoState: toStringValue(
            columnValue("cryptoState"),
          ) as TrackingRecord["cryptoState"],
        },
        this.fieldCrypto,
        {
          tableName: this.schema.tableName,
          store: "sql",
        },
        this.cryptoMode(),
      );
      const retentionClass = toStringValue(columnValue("retentionClass"));
      if (retentionClass.length > 0) {
        restored.retentionClass =
          retentionClass as TrackingRecord["retentionClass"];
      }
      const retentionBucketYm = toNumberValue(
        columnValue("retentionBucketYm"),
        0,
      );
      if (retentionBucketYm > 0) {
        restored.retentionBucketYm = retentionBucketYm;
      }
      return restored;
    }

    return record;
  }

  private tableRef(): string {
    return this.quoteIdentifier(this.schema.tableName);
  }

  // JSONB on Postgres and JSON on MySQL unless typeStrategy.json is "text".
  private hasNativeJsonColumns(): boolean {
    return (
      this.schema.typeStrategy.json === "auto" &&
      this.client.dialect !== "sqlite"
    );
  }

  // The stored columns, with JSON columns read as JSON text.
  private selectListSql(): string {
    return getDeliveryTrackingColumnKeys(this.schema)
      .map((key) => {
        const column = this.quoteIdentifier(this.columnName(key));
        return JSON_COLUMN_KEYS.has(key)
          ? selectJsonAsTextSql(this.client.dialect, column)
          : column;
      })
      .join(", ");
  }

  private valueSql(key: DeliveryTrackingColumnKey, placeholder: string) {
    return JSON_COLUMN_KEYS.has(key)
      ? jsonParameterSql(
          this.client.dialect,
          placeholder,
          this.hasNativeJsonColumns(),
        )
      : placeholder;
  }

  private jsonText(value: unknown): string {
    return toJsonText(
      value,
      this.client.dialect === "postgres" && this.hasNativeJsonColumns(),
    );
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
    record: TrackingRecord & TrackingCryptoColumns,
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
      case "toEnc":
        return record.toEnc ?? null;
      case "toHash":
        return record.toHash ?? null;
      case "toMasked":
        return record.toMasked ?? null;
      case "from":
        return record.from ?? null;
      case "fromEnc":
        return record.fromEnc ?? null;
      case "fromHash":
        return record.fromHash ?? null;
      case "fromMasked":
        return record.fromMasked ?? null;
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
        return record.lastError ? this.jsonText(record.lastError) : null;
      case "raw":
        return record.raw !== undefined ? this.jsonText(record.raw) : null;
      case "metadata":
        return record.metadata ? this.jsonText(record.metadata) : null;
      case "metadataEnc":
        return record.metadataEnc ?? null;
      case "metadataHashes":
        return record.metadataHashes
          ? this.jsonText(record.metadataHashes)
          : null;
      case "cryptoKid":
        return record.cryptoKid ?? null;
      case "cryptoVersion":
        return record.cryptoVersion ?? 1;
      case "cryptoState":
        return record.cryptoState ?? null;
      case "retentionClass":
        return record.retentionClass ?? null;
      case "retentionBucketYm":
        return record.retentionBucketYm ?? null;
      default:
        return null;
    }
  }

  private async prepareRecordForStorage(
    record: TrackingRecord,
  ): Promise<TrackingRecord & TrackingCryptoColumns> {
    const mode = this.cryptoMode();
    const cryptoColumns = await applyTrackingCryptoOnWrite(
      record,
      this.fieldCrypto,
      {
        tableName: this.schema.tableName,
        store: "sql",
      },
      mode,
    );

    const retentionClass = record.retentionClass ?? "telecomMetadata";
    const retentionDays = await resolveRetentionDays(this.retention, {
      tenantId: this.fieldCrypto?.tenantId,
      record,
      retentionClass,
    });
    const retentionAnchor = new Date(record.requestedAt);
    retentionAnchor.setUTCDate(retentionAnchor.getUTCDate() + retentionDays);

    return {
      ...record,
      ...cryptoColumns,
      retentionClass,
      retentionBucketYm:
        record.retentionBucketYm ?? toRetentionBucketYm(retentionAnchor),
    };
  }

  // Resolves to undefined when no record can match the filter.
  private async normalizeFilterForCrypto<
    T extends DeliveryTrackingRecordFilter,
  >(filter: T): Promise<T | undefined> {
    const normalized = await normalizeTrackingFilterWithHashes(
      filter,
      this.fieldCrypto,
      this.cryptoMode(),
      {
        tableName: this.schema.tableName,
        store: "sql",
      },
    );
    return normalized as T | undefined;
  }

  private patchTouchesCrypto(patch: Partial<TrackingRecord>): boolean {
    if (!this.schema.fieldCrypto.enabled) {
      return false;
    }
    return (
      patch.to !== undefined ||
      "from" in patch ||
      "metadata" in patch ||
      patch.toHash !== undefined ||
      patch.fromHash !== undefined ||
      patch.cryptoKid !== undefined ||
      patch.cryptoState !== undefined ||
      patch.cryptoVersion !== undefined ||
      patch.retentionClass !== undefined ||
      patch.retentionBucketYm !== undefined
    );
  }

  private hasPlainColumns(): boolean {
    if (!this.schema.fieldCrypto.enabled) return true;
    if (this.schema.fieldCrypto.mode !== "secure") return true;
    return this.schema.fieldCrypto.compatPlainColumns;
  }

  private cryptoMode(): TrackingCryptoMode {
    return {
      secureMode:
        this.schema.fieldCrypto.enabled &&
        this.schema.fieldCrypto.mode === "secure",
      compatPlainColumns: this.hasPlainColumns(),
    };
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

    // A hash lookup multiplies its values by the candidate keys, and D1 binds
    // at most 100 parameters per statement, so SQLite takes a hash list as one
    // JSON parameter.
    const addHashEquals = (
      column: string,
      value: string | string[] | undefined,
    ): void => {
      const values = toArray(value)?.filter(
        (item) => item !== undefined && item !== null,
      );
      if (this.client.dialect !== "sqlite" || !values || values.length < 2) {
        addEquals(column, value);
        return;
      }
      clauses.push(
        `${this.quoteIdentifier(column)} IN (SELECT value FROM json_each(${this.placeholder(params.length + 1)}))`,
      );
      params.push(JSON.stringify(values));
    };

    addEquals(this.columnName("messageId"), filter.messageId);
    addEquals(this.columnName("providerId"), filter.providerId);
    addEquals(this.columnName("providerMessageId"), filter.providerMessageId);
    addEquals(this.columnName("type"), filter.type);
    addEquals(this.columnName("status"), filter.status);
    if (this.schema.fieldCrypto.enabled) {
      addHashEquals(this.columnName("toHash"), filter.toHash);
      addHashEquals(this.columnName("fromHash"), filter.fromHash);
      if (this.hasPlainColumns()) {
        addEquals(this.columnName("to"), filter.to);
        addEquals(this.columnName("from"), filter.from);
      }
    } else {
      addEquals(this.columnName("to"), filter.to);
      addEquals(this.columnName("from"), filter.from);
    }

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
  if (record.metadataHashes) next.metadataHashes = { ...record.metadataHashes };
  if (record.toHash) next.toHash = record.toHash;
  if (record.toMasked) next.toMasked = record.toMasked;
  if (record.fromHash) next.fromHash = record.fromHash;
  if (record.fromMasked) next.fromMasked = record.fromMasked;
  if (record.cryptoKid) next.cryptoKid = record.cryptoKid;
  if (record.cryptoState) next.cryptoState = record.cryptoState;
  if (record.cryptoVersion) next.cryptoVersion = record.cryptoVersion;
  if (record.retentionClass) next.retentionClass = record.retentionClass;
  if (record.retentionBucketYm)
    next.retentionBucketYm = record.retentionBucketYm;

  if (isTerminalDeliveryStatus(next.status)) {
    next.nextCheckAt = new Date(next.statusUpdatedAt);
  }

  return next;
}
