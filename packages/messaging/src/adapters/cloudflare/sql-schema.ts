import type { CloudflareSqlClient, SqlDialect } from "./sql-client";

export const DEFAULT_DELIVERY_TRACKING_TABLE = "kmsg_delivery_tracking";
export const DEFAULT_JOB_QUEUE_TABLE = "kmsg_jobs";

export type CloudflareSqlSchemaTarget = "tracking" | "queue" | "both";

export interface BuildDeliveryTrackingSchemaSqlOptions {
  dialect: SqlDialect;
  tableName?: string;
  includeIndexes?: boolean;
}

export interface BuildJobQueueSchemaSqlOptions {
  dialect: SqlDialect;
  tableName?: string;
  includeIndexes?: boolean;
}

export interface BuildCloudflareSqlSchemaSqlOptions {
  dialect: SqlDialect;
  target?: CloudflareSqlSchemaTarget;
  trackingTableName?: string;
  queueTableName?: string;
  includeIndexes?: boolean;
}

export interface InitializeCloudflareSqlSchemaOptions {
  target?: CloudflareSqlSchemaTarget;
  trackingTableName?: string;
  queueTableName?: string;
  includeIndexes?: boolean;
}

type SchemaStatements = {
  tableStatements: string[];
  indexStatements: string[];
};

type SqlErrorLike = {
  code?: unknown;
  errno?: unknown;
  sqlState?: unknown;
  message?: unknown;
  cause?: unknown;
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
  const tableName = options.tableName ?? DEFAULT_DELIVERY_TRACKING_TABLE;
  const includeIndexes = options.includeIndexes ?? true;
  const q = (column: string) => quoteIdentifier(options.dialect, column);
  const tableRef = quoteIdentifier(options.dialect, tableName);

  const idType = options.dialect === "mysql" ? "VARCHAR(255)" : "TEXT";
  const shortType = options.dialect === "mysql" ? "VARCHAR(64)" : "TEXT";
  const jsonType = options.dialect === "postgres" ? "JSONB" : "TEXT";

  const tableSql = `
CREATE TABLE IF NOT EXISTS ${tableRef} (
  ${q("message_id")} ${idType} PRIMARY KEY,
  ${q("provider_id")} ${idType} NOT NULL,
  ${q("provider_message_id")} ${idType} NOT NULL,
  ${q("type")} ${shortType} NOT NULL,
  ${q("to")} ${shortType} NOT NULL,
  ${q("from")} ${shortType},
  ${q("status")} ${shortType} NOT NULL,
  ${q("provider_status_code")} ${shortType},
  ${q("provider_status_message")} ${shortType},
  ${q("sent_at")} BIGINT,
  ${q("delivered_at")} BIGINT,
  ${q("failed_at")} BIGINT,
  ${q("requested_at")} BIGINT NOT NULL,
  ${q("scheduled_at")} BIGINT,
  ${q("status_updated_at")} BIGINT NOT NULL,
  ${q("attempt_count")} INTEGER NOT NULL DEFAULT 0,
  ${q("last_checked_at")} BIGINT,
  ${q("next_check_at")} BIGINT NOT NULL,
  ${q("last_error")} ${jsonType},
  ${q("raw")} ${jsonType},
  ${q("metadata")} ${jsonType}
)`;

  const indexDefs: Array<{ name: string; columns: string[] }> = [
    { name: "idx_kmsg_delivery_due", columns: ["status", "next_check_at"] },
    {
      name: "idx_kmsg_delivery_provider_msg",
      columns: ["provider_id", "provider_message_id"],
    },
    { name: "idx_kmsg_delivery_requested_at", columns: ["requested_at"] },
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

  const tableSql = `
CREATE TABLE IF NOT EXISTS ${tableRef} (
  ${q("id")} ${idType} PRIMARY KEY,
  ${q("type")} ${queueType} NOT NULL,
  ${q("data")} ${jsonType} NOT NULL,
  ${q("status")} ${statusType} NOT NULL DEFAULT 'pending',
  ${q("priority")} INTEGER NOT NULL DEFAULT 0,
  ${q("attempts")} INTEGER NOT NULL DEFAULT 0,
  ${q("max_attempts")} INTEGER NOT NULL DEFAULT 3,
  ${q("delay")} INTEGER NOT NULL DEFAULT 0,
  ${q("created_at")} BIGINT NOT NULL,
  ${q("process_at")} BIGINT NOT NULL,
  ${q("completed_at")} BIGINT,
  ${q("failed_at")} BIGINT,
  ${q("error")} TEXT,
  ${q("metadata")} ${jsonType}
)`;

  const indexDefs: Array<{ name: string; columns: string[] }> = [
    {
      name: "idx_kmsg_jobs_dequeue",
      columns: ["status", "priority", "process_at", "created_at"],
    },
    { name: "idx_kmsg_jobs_id", columns: ["id"] },
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

function mergeSchemaStatements(
  ...schemas: readonly SchemaStatements[]
): SchemaStatements {
  return {
    tableStatements: schemas.flatMap((schema) => schema.tableStatements),
    indexStatements: schemas.flatMap((schema) => schema.indexStatements),
  };
}

function toErrorLike(error: unknown): SqlErrorLike | undefined {
  if (!error || typeof error !== "object") return undefined;
  return error as SqlErrorLike;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function hasDuplicateMessage(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase();
  return (
    normalized.includes("already exists") ||
    normalized.includes("duplicate key name") ||
    normalized.includes("duplicate object")
  );
}

export function isDuplicateOrExistsSchemaError(
  dialect: SqlDialect,
  error: unknown,
): boolean {
  const parsed = toErrorLike(error);
  const code =
    typeof parsed?.code === "string" ? parsed.code.toUpperCase() : undefined;
  const errno = asNumber(parsed?.errno);
  const sqlState =
    typeof parsed?.sqlState === "string"
      ? parsed.sqlState.toUpperCase()
      : undefined;
  const message = parsed?.message;

  if (dialect === "postgres") {
    if (code === "42P07" || code === "42710") return true;
    return hasDuplicateMessage(message);
  }

  if (dialect === "mysql") {
    if (code === "ER_DUP_KEYNAME" || code === "ER_TABLE_EXISTS_ERROR") {
      return true;
    }
    if (errno === 1061 || errno === 1050) return true;
    if (sqlState === "42S01") return true;
    return hasDuplicateMessage(message);
  }

  if (dialect === "sqlite") {
    return hasDuplicateMessage(message);
  }

  return false;
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

export function buildCloudflareSqlSchemaSql(
  options: BuildCloudflareSqlSchemaSqlOptions,
): string {
  const target = toSchemaTarget(options.target);
  const includeIndexes = options.includeIndexes ?? true;
  const schemas: SchemaStatements[] = [];

  if (target === "tracking" || target === "both") {
    schemas.push(
      buildDeliveryTrackingSchemaStatements({
        dialect: options.dialect,
        tableName: options.trackingTableName,
        includeIndexes,
      }),
    );
  }

  if (target === "queue" || target === "both") {
    schemas.push(
      buildJobQueueSchemaStatements({
        dialect: options.dialect,
        tableName: options.queueTableName,
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
  const target = toSchemaTarget(options.target);
  const includeIndexes = options.includeIndexes ?? true;

  const schemas: SchemaStatements[] = [];
  if (target === "tracking" || target === "both") {
    schemas.push(
      buildDeliveryTrackingSchemaStatements({
        dialect: client.dialect,
        tableName: options.trackingTableName,
        includeIndexes,
      }),
    );
  }
  if (target === "queue" || target === "both") {
    schemas.push(
      buildJobQueueSchemaStatements({
        dialect: client.dialect,
        tableName: options.queueTableName,
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
