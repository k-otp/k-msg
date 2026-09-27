import { buildFieldCryptoMigrationStateStatements } from "../../migration/field-crypto/state";
import {
  DEFAULT_DELIVERY_TRACKING_TABLE as DEFAULT_DELIVERY_TRACKING_TABLE_NAME,
  type DeliveryTrackingColumnMap,
  type DeliveryTrackingFieldCryptoSchemaOptions,
  type DeliveryTrackingSchemaOptions,
  type DeliveryTrackingSchemaSpec,
  type DeliveryTrackingTypeStrategy,
  getDeliveryTrackingSchemaSpec,
  resolveDeliveryTrackingSqlType,
} from "./delivery-tracking-schema";
import {
  type CloudflareSqlClient,
  isDuplicateOrExistsSchemaError,
  type SqlDialect,
} from "./sql-client";

export const DEFAULT_DELIVERY_TRACKING_TABLE =
  DEFAULT_DELIVERY_TRACKING_TABLE_NAME;
export const DEFAULT_JOB_QUEUE_TABLE = "kmsg_jobs";

/**
 * Names of the job queue indexes. SQLite and D1 need index names to be unique
 * per database, and Postgres per schema, so each queue table sharing one needs
 * its own names.
 */
export interface JobQueueIndexNames {
  /** @default "idx_kmsg_jobs_dequeue" */
  dequeue: string;
  /** @default "idx_kmsg_jobs_id" */
  id: string;
}

const DEFAULT_JOB_QUEUE_INDEX_NAMES: JobQueueIndexNames = {
  dequeue: "idx_kmsg_jobs_dequeue",
  id: "idx_kmsg_jobs_id",
};

function normalizeIndexName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveJobQueueIndexNames(
  overrides: Partial<JobQueueIndexNames> | undefined,
): JobQueueIndexNames {
  return {
    dequeue:
      normalizeIndexName(overrides?.dequeue) ??
      DEFAULT_JOB_QUEUE_INDEX_NAMES.dequeue,
    id: normalizeIndexName(overrides?.id) ?? DEFAULT_JOB_QUEUE_INDEX_NAMES.id,
  };
}

export type CloudflareSqlSchemaTarget = "tracking" | "queue" | "both";

export interface BuildDeliveryTrackingSchemaSqlOptions
  extends DeliveryTrackingSchemaOptions {
  dialect: SqlDialect;
  includeIndexes?: boolean;
  trackingIndexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
}

export interface BuildJobQueueSchemaSqlOptions {
  dialect: SqlDialect;
  tableName?: string;
  indexNames?: Partial<JobQueueIndexNames>;
  includeIndexes?: boolean;
}

export interface BuildCloudflareSqlSchemaSqlOptions {
  dialect: SqlDialect;
  target?: CloudflareSqlSchemaTarget;
  trackingTableName?: string;
  trackingColumnMap?: Partial<DeliveryTrackingColumnMap>;
  trackingTypeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  typeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  trackingStoreRaw?: boolean;
  fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
  trackingIndexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
  includeMigrationMeta?: boolean;
  migrationRunsTableName?: string;
  migrationChunksTableName?: string;
  queueTableName?: string;
  queueIndexNames?: Partial<JobQueueIndexNames>;
  includeIndexes?: boolean;
}

export interface InitializeCloudflareSqlSchemaOptions {
  target?: CloudflareSqlSchemaTarget;
  trackingTableName?: string;
  trackingColumnMap?: Partial<DeliveryTrackingColumnMap>;
  trackingTypeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  typeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  trackingStoreRaw?: boolean;
  fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
  trackingIndexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
  includeMigrationMeta?: boolean;
  migrationRunsTableName?: string;
  migrationChunksTableName?: string;
  queueTableName?: string;
  queueIndexNames?: Partial<JobQueueIndexNames>;
  includeIndexes?: boolean;
}

export interface BuildFieldCryptoMigrationMetaSchemaSqlOptions {
  dialect: SqlDialect;
  runsTableName?: string;
  chunksTableName?: string;
  includeIndexes?: boolean;
}

type SchemaStatements = {
  tableStatements: string[];
  indexStatements: string[];
};

function quoteIdentifier(dialect: SqlDialect, identifier: string): string {
  if (dialect === "mysql") {
    return `\`${identifier.replace(/`/g, "``")}\``;
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

function normalizeStatement(sql: string): string {
  const trimmed = sql.trim();
  if (trimmed.endsWith(";")) return trimmed;
  return `${trimmed};`;
}

function renderStatements(statements: readonly string[]): string {
  return statements
    .map((statement) => normalizeStatement(statement))
    .join("\n\n");
}

function toSchemaTarget(
  value: CloudflareSqlSchemaTarget | undefined,
): CloudflareSqlSchemaTarget {
  if (value === "tracking" || value === "queue" || value === "both") {
    return value;
  }
  return "both";
}

function buildDeliveryTrackingSchemaStatements(
  options: BuildDeliveryTrackingSchemaSqlOptions,
): SchemaStatements {
  const trackingTypeStrategy =
    options.typeStrategy ?? options.trackingTypeStrategy;

  const spec = getDeliveryTrackingSchemaSpec({
    tableName: options.tableName,
    columnMap: options.columnMap,
    typeStrategy: trackingTypeStrategy,
    storeRaw: options.storeRaw,
    fieldCryptoSchema: options.fieldCryptoSchema,
    indexNames: options.indexNames,
    trackingIndexNames: options.trackingIndexNames,
  });

  const includeIndexes = options.includeIndexes ?? true;
  const q = (column: string) => quoteIdentifier(options.dialect, column);
  const tableRef = quoteIdentifier(options.dialect, spec.tableName);

  const columns = spec.columnMap;
  const strategy = spec.typeStrategy;

  const tableColumns: string[] = [
    `${q(columns.messageId)} ${resolveDeliveryTrackingSqlType(options.dialect, "messageId", strategy)} PRIMARY KEY`,
    `${q(columns.providerId)} ${resolveDeliveryTrackingSqlType(options.dialect, "indexedId", strategy)} NOT NULL`,
    `${q(columns.providerMessageId)} ${resolveDeliveryTrackingSqlType(options.dialect, "indexedId", strategy)} NOT NULL`,
    `${q(columns.type)} ${resolveDeliveryTrackingSqlType(options.dialect, "shortText", strategy)} NOT NULL`,
  ];

  const secureOnly =
    spec.fieldCrypto.enabled && spec.fieldCrypto.mode === "secure";
  const includePlainColumns =
    !secureOnly || spec.fieldCrypto.compatPlainColumns;

  if (includePlainColumns) {
    tableColumns.push(
      `${q(columns.to)} ${resolveDeliveryTrackingSqlType(options.dialect, "shortText", strategy)} NOT NULL`,
      `${q(columns.from)} ${resolveDeliveryTrackingSqlType(options.dialect, "shortText", strategy)}`,
    );
  }

  if (secureOnly) {
    tableColumns.push(
      `${q(columns.toEnc)} ${resolveDeliveryTrackingSqlType(options.dialect, "id", strategy)} NOT NULL`,
      `${q(columns.toHash)} ${resolveDeliveryTrackingSqlType(options.dialect, "indexedId", strategy)} NOT NULL`,
      `${q(columns.toMasked)} ${resolveDeliveryTrackingSqlType(options.dialect, "id", strategy)} NOT NULL`,
      `${q(columns.fromEnc)} ${resolveDeliveryTrackingSqlType(options.dialect, "id", strategy)}`,
      `${q(columns.fromHash)} ${resolveDeliveryTrackingSqlType(options.dialect, "indexedId", strategy)}`,
      `${q(columns.fromMasked)} ${resolveDeliveryTrackingSqlType(options.dialect, "id", strategy)}`,
    );
  }

  tableColumns.push(
    `${q(columns.status)} ${resolveDeliveryTrackingSqlType(options.dialect, "indexedShortText", strategy)} NOT NULL`,
    `${q(columns.providerStatusCode)} ${resolveDeliveryTrackingSqlType(options.dialect, "shortText", strategy)}`,
    `${q(columns.providerStatusMessage)} ${resolveDeliveryTrackingSqlType(options.dialect, "text", strategy)}`,
    `${q(columns.sentAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)}`,
    `${q(columns.deliveredAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)}`,
    `${q(columns.failedAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)}`,
    `${q(columns.requestedAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)} NOT NULL`,
    `${q(columns.scheduledAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)}`,
    `${q(columns.statusUpdatedAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)} NOT NULL`,
    `${q(columns.attemptCount)} ${resolveDeliveryTrackingSqlType(options.dialect, "attemptCount", strategy)} NOT NULL DEFAULT 0`,
    `${q(columns.lastCheckedAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)}`,
    `${q(columns.nextCheckAt)} ${resolveDeliveryTrackingSqlType(options.dialect, "timestamp", strategy)} NOT NULL`,
    `${q(columns.lastError)} ${resolveDeliveryTrackingSqlType(options.dialect, "json", strategy)}`,
  );

  if (secureOnly) {
    tableColumns.push(
      `${q(columns.metadataEnc)} ${resolveDeliveryTrackingSqlType(options.dialect, "text", strategy)}`,
      `${q(columns.metadataHashes)} ${resolveDeliveryTrackingSqlType(options.dialect, "json", strategy)}`,
      `${q(columns.cryptoKid)} ${resolveDeliveryTrackingSqlType(options.dialect, "id", strategy)}`,
      `${q(columns.cryptoVersion)} ${resolveDeliveryTrackingSqlType(options.dialect, "attemptCount", strategy)} NOT NULL DEFAULT 1`,
      `${q(columns.cryptoState)} ${resolveDeliveryTrackingSqlType(options.dialect, "shortText", strategy)}`,
      `${q(columns.retentionClass)} ${resolveDeliveryTrackingSqlType(options.dialect, "indexedShortText", strategy)}`,
      `${q(columns.retentionBucketYm)} ${resolveDeliveryTrackingSqlType(options.dialect, "attemptCount", strategy)}`,
    );
  }

  if (spec.storeRaw) {
    tableColumns.push(
      `${q(columns.raw)} ${resolveDeliveryTrackingSqlType(options.dialect, "json", strategy)}`,
    );
  }

  if (includePlainColumns) {
    tableColumns.push(
      `${q(columns.metadata)} ${resolveDeliveryTrackingSqlType(options.dialect, "json", strategy)}`,
    );
  }

  const tableSql = `
CREATE TABLE IF NOT EXISTS ${tableRef} (
  ${tableColumns.join(",\n  ")}
)`;

  const indexDefs: Array<{ name: string; columns: string[] }> = [
    {
      name: spec.indexNames.due,
      columns: [columns.status, columns.nextCheckAt],
    },
    {
      name: spec.indexNames.providerMessage,
      columns: [columns.providerId, columns.providerMessageId],
    },
    { name: spec.indexNames.requestedAt, columns: [columns.requestedAt] },
  ];

  if (secureOnly) {
    indexDefs.push(
      { name: spec.indexNames.toHash, columns: [columns.toHash] },
      { name: spec.indexNames.fromHash, columns: [columns.fromHash] },
      {
        name: spec.indexNames.retentionBucket,
        columns: [columns.retentionClass, columns.retentionBucketYm],
      },
    );
  }

  const indexStatements =
    includeIndexes === false
      ? []
      : indexDefs.map((definition) => {
          const indexRef = quoteIdentifier(options.dialect, definition.name);
          const columnsSql = definition.columns
            .map((column) => q(column))
            .join(", ");
          if (options.dialect === "mysql") {
            return `CREATE INDEX ${indexRef} ON ${tableRef} (${columnsSql})`;
          }
          return `CREATE INDEX IF NOT EXISTS ${indexRef} ON ${tableRef} (${columnsSql})`;
        });

  return {
    tableStatements: [tableSql],
    indexStatements,
  };
}

function buildJobQueueSchemaStatements(
  options: BuildJobQueueSchemaSqlOptions,
): SchemaStatements {
  const tableName = options.tableName ?? DEFAULT_JOB_QUEUE_TABLE;
  const includeIndexes = options.includeIndexes ?? true;
  const q = (column: string) => quoteIdentifier(options.dialect, column);
  const tableRef = quoteIdentifier(options.dialect, tableName);

  const idType = options.dialect === "mysql" ? "VARCHAR(255)" : "TEXT";
  const queueType = options.dialect === "mysql" ? "VARCHAR(128)" : "TEXT";
  const statusType = options.dialect === "mysql" ? "VARCHAR(32)" : "TEXT";
  const jsonType = options.dialect === "postgres" ? "JSONB" : "TEXT";
  // Milliseconds; 2^31 ms (about 24.9 days) overflows the 32-bit INTEGER of
  // Postgres and MySQL. SQLite's INTEGER is 64-bit.
  const delayType = options.dialect === "sqlite" ? "INTEGER" : "BIGINT";

  const tableSql = `
CREATE TABLE IF NOT EXISTS ${tableRef} (
  ${q("id")} ${idType} PRIMARY KEY,
  ${q("type")} ${queueType} NOT NULL,
  ${q("data")} ${jsonType} NOT NULL,
  ${q("status")} ${statusType} NOT NULL DEFAULT 'pending',
  ${q("priority")} INTEGER NOT NULL DEFAULT 0,
  ${q("attempts")} INTEGER NOT NULL DEFAULT 0,
  ${q("max_attempts")} INTEGER NOT NULL DEFAULT 3,
  ${q("delay")} ${delayType} NOT NULL DEFAULT 0,
  ${q("created_at")} BIGINT NOT NULL,
  ${q("process_at")} BIGINT NOT NULL,
  ${q("completed_at")} BIGINT,
  ${q("failed_at")} BIGINT,
  ${q("error")} TEXT,
  ${q("metadata")} ${jsonType}
)`;

  const indexNames = resolveJobQueueIndexNames(options.indexNames);
  const indexDefs: Array<{ name: string; columns: string[] }> = [
    {
      name: indexNames.dequeue,
      columns: ["status", "priority", "process_at", "created_at"],
    },
    { name: indexNames.id, columns: ["id"] },
  ];

  const indexStatements =
    includeIndexes === false
      ? []
      : indexDefs.map((definition) => {
          const indexRef = quoteIdentifier(options.dialect, definition.name);
          const columnsSql = definition.columns
            .map((column) => q(column))
            .join(", ");
          if (options.dialect === "mysql") {
            return `CREATE INDEX ${indexRef} ON ${tableRef} (${columnsSql})`;
          }
          return `CREATE INDEX IF NOT EXISTS ${indexRef} ON ${tableRef} (${columnsSql})`;
        });

  return {
    tableStatements: [tableSql],
    indexStatements,
  };
}

function buildFieldCryptoMigrationMetaSchemaStatements(
  options: BuildFieldCryptoMigrationMetaSchemaSqlOptions,
): SchemaStatements {
  return buildFieldCryptoMigrationStateStatements(options.dialect, options);
}

function mergeSchemaStatements(
  ...schemas: readonly SchemaStatements[]
): SchemaStatements {
  return {
    tableStatements: schemas.flatMap((schema) => schema.tableStatements),
    indexStatements: schemas.flatMap((schema) => schema.indexStatements),
  };
}

export function buildDeliveryTrackingSchemaSql(
  options: BuildDeliveryTrackingSchemaSqlOptions,
): string {
  const statements = buildDeliveryTrackingSchemaStatements(options);
  return renderStatements([
    ...statements.tableStatements,
    ...statements.indexStatements,
  ]);
}

export function buildJobQueueSchemaSql(
  options: BuildJobQueueSchemaSqlOptions,
): string {
  const statements = buildJobQueueSchemaStatements(options);
  return renderStatements([
    ...statements.tableStatements,
    ...statements.indexStatements,
  ]);
}

export function buildFieldCryptoMigrationMetaSchemaSql(
  options: BuildFieldCryptoMigrationMetaSchemaSqlOptions,
): string {
  const statements = buildFieldCryptoMigrationMetaSchemaStatements(options);
  return renderStatements([
    ...statements.tableStatements,
    ...statements.indexStatements,
  ]);
}

export function buildCloudflareSqlSchemaSql(
  options: BuildCloudflareSqlSchemaSqlOptions,
): string {
  const resolvedTrackingTypeStrategy =
    options.typeStrategy ?? options.trackingTypeStrategy;
  const target = toSchemaTarget(options.target);
  const includeIndexes = options.includeIndexes ?? true;
  const schemas: SchemaStatements[] = [];

  if (target === "tracking" || target === "both") {
    schemas.push(
      buildDeliveryTrackingSchemaStatements({
        dialect: options.dialect,
        tableName: options.trackingTableName,
        columnMap: options.trackingColumnMap,
        typeStrategy: resolvedTrackingTypeStrategy,
        storeRaw: options.trackingStoreRaw,
        fieldCryptoSchema: options.fieldCryptoSchema,
        includeIndexes,
        trackingIndexNames: options.trackingIndexNames,
      }),
    );

    if (options.includeMigrationMeta) {
      schemas.push(
        buildFieldCryptoMigrationMetaSchemaStatements({
          dialect: options.dialect,
          runsTableName: options.migrationRunsTableName,
          chunksTableName: options.migrationChunksTableName,
          includeIndexes,
        }),
      );
    }
  }

  if (target === "queue" || target === "both") {
    schemas.push(
      buildJobQueueSchemaStatements({
        dialect: options.dialect,
        tableName: options.queueTableName,
        indexNames: options.queueIndexNames,
        includeIndexes,
      }),
    );
  }

  const statements = mergeSchemaStatements(...schemas);
  return renderStatements([
    ...statements.tableStatements,
    ...statements.indexStatements,
  ]);
}

export async function initializeCloudflareSqlSchema(
  client: CloudflareSqlClient,
  options: InitializeCloudflareSqlSchemaOptions = {},
): Promise<void> {
  const resolvedTrackingTypeStrategy =
    options.typeStrategy ?? options.trackingTypeStrategy;
  const target = toSchemaTarget(options.target);
  const includeIndexes = options.includeIndexes ?? true;

  const schemas: SchemaStatements[] = [];
  if (target === "tracking" || target === "both") {
    schemas.push(
      buildDeliveryTrackingSchemaStatements({
        dialect: client.dialect,
        tableName: options.trackingTableName,
        columnMap: options.trackingColumnMap,
        typeStrategy: resolvedTrackingTypeStrategy,
        storeRaw: options.trackingStoreRaw,
        fieldCryptoSchema: options.fieldCryptoSchema,
        includeIndexes,
        trackingIndexNames: options.trackingIndexNames,
      }),
    );

    if (options.includeMigrationMeta) {
      schemas.push(
        buildFieldCryptoMigrationMetaSchemaStatements({
          dialect: client.dialect,
          runsTableName: options.migrationRunsTableName,
          chunksTableName: options.migrationChunksTableName,
          includeIndexes,
        }),
      );
    }
  }
  if (target === "queue" || target === "both") {
    schemas.push(
      buildJobQueueSchemaStatements({
        dialect: client.dialect,
        tableName: options.queueTableName,
        indexNames: options.queueIndexNames,
        includeIndexes,
      }),
    );
  }

  const statements = mergeSchemaStatements(...schemas);
  const orderedStatements = [
    ...statements.tableStatements,
    ...statements.indexStatements,
  ];

  for (const statement of orderedStatements) {
    try {
      await client.query(statement);
    } catch (error) {
      if (isDuplicateOrExistsSchemaError(client.dialect, error)) {
        continue;
      }
      throw error;
    }
  }
}
