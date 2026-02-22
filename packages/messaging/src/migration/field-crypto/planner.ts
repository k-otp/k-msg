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
  upsertFieldCryptoMigrationRun,
} from "./state";
import type {
  FieldCryptoMigrationPlan,
  FieldCryptoMigrationPlanInput,
  FieldCryptoMigrationRunRecord,
} from "./types";

export interface PlanFieldCryptoMigrationOptions
  extends FieldCryptoMigrationPlanInput {
  client: CloudflareSqlClient;
}

function quoteIdentifier(dialect: SqlDialect, identifier: string): string {
  if (dialect === "mysql") {
    return `\`${identifier.replace(/`/g, "``")}\``;
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toChunkSize(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1000;
  return Math.max(100, Math.floor(value));
}

function hashText(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function buildSchemaFingerprint(spec: DeliveryTrackingSchemaSpec): string {
  return hashText(
    JSON.stringify({
      tableName: spec.tableName,
      columnMap: spec.columnMap,
      typeStrategy: spec.typeStrategy,
      fieldCrypto: spec.fieldCrypto,
    }),
  );
}

function buildPlanId(
  trackingTableName: string,
  chunkSize: number,
  schemaFingerprint: string,
): string {
  const token = hashText(
    `${trackingTableName}|${chunkSize}|${schemaFingerprint}`,
  );
  return `fcmig_${token}`;
}

export async function planFieldCryptoMigration(
  options: PlanFieldCryptoMigrationOptions,
): Promise<FieldCryptoMigrationPlan> {
  const chunkSize = toChunkSize(options.chunkSize);
  const spec = getDeliveryTrackingSchemaSpec({
    tableName: options.trackingTableName,
    fieldCryptoSchema: options.fieldCryptoSchema ?? {
      enabled: true,
      mode: "secure",
      compatPlainColumns: true,
    },
  });
  const schemaFingerprint = buildSchemaFingerprint(spec);
  const planId = buildPlanId(spec.tableName, chunkSize, schemaFingerprint);
  const q = (name: string) => quoteIdentifier(options.client.dialect, name);
  const tableRef = q(spec.tableName);
  const countColumn = q(spec.columnMap.messageId);

  await ensureFieldCryptoMigrationStateTables(options.client, {
    runsTableName: options.runsTableName,
    chunksTableName: options.chunksTableName,
  });

  const { rows } = await options.client.query<{ count?: number | string }>(
    `SELECT COUNT(${countColumn}) as count FROM ${tableRef}`,
  );
  const totalRows = toNumber(rows[0]?.count);
  const estimatedChunks =
    totalRows === 0 ? 0 : Math.ceil(totalRows / Math.max(1, chunkSize));
  const now = Date.now();

  const runRecord: FieldCryptoMigrationRunRecord = {
    planId,
    trackingTableName: spec.tableName,
    schemaFingerprint,
    status: "planned",
    chunkSize,
    totalRows,
    totalChunks: estimatedChunks,
    processedRows: 0,
    processedChunks: 0,
    failedChunks: 0,
    createdAt: now,
    updatedAt: now,
  };
  await upsertFieldCryptoMigrationRun(options.client, runRecord, {
    runsTableName: options.runsTableName,
    chunksTableName: options.chunksTableName,
  });

  return {
    planId,
    trackingTableName: spec.tableName,
    chunkSize,
    totalRows,
    estimatedChunks,
    schemaFingerprint,
    createdAt: now,
  };
}
