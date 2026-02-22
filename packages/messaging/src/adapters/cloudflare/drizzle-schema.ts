import {
  type DeliveryTrackingColumnMap,
  type DeliveryTrackingSchemaSpec,
  type DeliveryTrackingTypeStrategy,
  getDeliveryTrackingSchemaSpec,
} from "./delivery-tracking-schema";
import type { SqlDialect } from "./sql-client";
import {
  type CloudflareSqlSchemaTarget,
  DEFAULT_JOB_QUEUE_TABLE,
} from "./sql-schema";

export interface RenderDrizzleSchemaSourceOptions {
  dialect: SqlDialect;
  target?: CloudflareSqlSchemaTarget;
  trackingTableName?: string;
  trackingColumnMap?: Partial<DeliveryTrackingColumnMap>;
  typeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  trackingTypeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
  indexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
  trackingStoreRaw?: boolean;
  trackingIndexNames?: Partial<DeliveryTrackingSchemaSpec["indexNames"]>;
  queueTableName?: string;
}

function toSchemaTarget(
  value: CloudflareSqlSchemaTarget | undefined,
): CloudflareSqlSchemaTarget {
  if (value === "tracking" || value === "queue" || value === "both") {
    return value;
  }
  return "both";
}

function q(value: string): string {
  return JSON.stringify(value);
}

function renderPostgresTrackingSchema(
  options: RenderDrizzleSchemaSourceOptions,
): string {
  const trackingTypeStrategy =
    options.typeStrategy ?? options.trackingTypeStrategy;
  const spec = getDeliveryTrackingSchemaSpec({
    tableName: options.trackingTableName,
    columnMap: options.trackingColumnMap,
    typeStrategy: trackingTypeStrategy,
    storeRaw: options.trackingStoreRaw,
    indexNames: options.indexNames,
    trackingIndexNames: options.trackingIndexNames,
  });
  const c = spec.columnMap;
  const s = spec.typeStrategy;

  const messageId =
    s.messageId === "uuid"
      ? `uuid(${q(c.messageId)}).primaryKey()`
      : s.messageId === "varchar"
        ? `varchar(${q(c.messageId)}, { length: 255 }).primaryKey()`
        : `text(${q(c.messageId)}).primaryKey()`;

  const idField = (columnName: string): string =>
    s.id === "varchar"
      ? `varchar(${q(columnName)}, { length: 255 }).notNull()`
      : `text(${q(columnName)}).notNull()`;

  const shortTextField = (columnName: string, required: boolean): string => {
    const base =
      s.shortText === "varchar"
        ? `varchar(${q(columnName)}, { length: 64 })`
        : `text(${q(columnName)})`;
    return required ? `${base}.notNull()` : base;
  };

  const timestampField = (columnName: string, required = false): string => {
    const base =
      s.timestamp === "integer"
        ? `integer(${q(columnName)})`
        : `bigint(${q(columnName)}, { mode: "number" })`;
    return required ? `${base}.notNull()` : base;
  };

  const jsonField = (columnName: string): string =>
    s.json === "text" ? `text(${q(columnName)})` : `jsonb(${q(columnName)})`;

  const rawFieldLine = spec.storeRaw ? `\n    raw: ${jsonField(c.raw)},` : "";

  return `export const deliveryTrackingTable = pgTable(
  ${q(spec.tableName)},
  {
    messageId: ${messageId},
    providerId: ${idField(c.providerId)},
    providerMessageId: ${idField(c.providerMessageId)},
    type: ${shortTextField(c.type, true)},
    to: ${shortTextField(c.to, true)},
    from: ${shortTextField(c.from, false)},
    status: ${shortTextField(c.status, true)},
    providerStatusCode: ${shortTextField(c.providerStatusCode, false)},
    providerStatusMessage: ${shortTextField(c.providerStatusMessage, false)},
    sentAt: ${timestampField(c.sentAt)},
    deliveredAt: ${timestampField(c.deliveredAt)},
    failedAt: ${timestampField(c.failedAt)},
    requestedAt: ${timestampField(c.requestedAt, true)},
    scheduledAt: ${timestampField(c.scheduledAt)},
    statusUpdatedAt: ${timestampField(c.statusUpdatedAt, true)},
    attemptCount: integer(${q(c.attemptCount)}).notNull().default(0),
    lastCheckedAt: ${timestampField(c.lastCheckedAt)},
    nextCheckAt: ${timestampField(c.nextCheckAt, true)},
    lastError: ${jsonField(c.lastError)},${rawFieldLine}
    metadata: ${jsonField(c.metadata)},
  },
  (table) => [
    index(${q(spec.indexNames.due)}).on(table.status, table.nextCheckAt),
    index(${q(spec.indexNames.providerMessage)}).on(
      table.providerId,
      table.providerMessageId,
    ),
    index(${q(spec.indexNames.requestedAt)}).on(table.requestedAt),
  ],
);`;
}

function renderPostgresQueueSchema(tableName: string): string {
  return `export const jobQueueTable = pgTable(
  ${q(tableName)},
  {
    id: text("id").primaryKey(),
    type: varchar("type", { length: 128 }).notNull(),
    data: jsonb("data").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    delay: integer("delay").notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    processAt: bigint("process_at", { mode: "number" }).notNull(),
    completedAt: bigint("completed_at", { mode: "number" }),
    failedAt: bigint("failed_at", { mode: "number" }),
    error: text("error"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("idx_kmsg_jobs_dequeue").on(
      table.status,
      table.priority,
      table.processAt,
      table.createdAt,
    ),
    index("idx_kmsg_jobs_id").on(table.id),
  ],
);`;
}

function renderMySqlTrackingSchema(
  options: RenderDrizzleSchemaSourceOptions,
): string {
  const trackingTypeStrategy =
    options.typeStrategy ?? options.trackingTypeStrategy;
  const spec = getDeliveryTrackingSchemaSpec({
    tableName: options.trackingTableName,
    columnMap: options.trackingColumnMap,
    typeStrategy: trackingTypeStrategy,
    storeRaw: options.trackingStoreRaw,
    indexNames: options.indexNames,
    trackingIndexNames: options.trackingIndexNames,
  });
  const c = spec.columnMap;
  const s = spec.typeStrategy;

  const messageId =
    s.messageId === "uuid"
      ? `varchar(${q(c.messageId)}, { length: 36 }).primaryKey()`
      : `varchar(${q(c.messageId)}, { length: 255 }).primaryKey()`;

  const idField = (columnName: string): string =>
    `varchar(${q(columnName)}, { length: 255 }).notNull()`;

  const shortTextField = (columnName: string, required: boolean): string => {
    const base =
      s.shortText === "varchar"
        ? `varchar(${q(columnName)}, { length: 64 })`
        : `text(${q(columnName)})`;
    return required ? `${base}.notNull()` : base;
  };

  const timestampField = (columnName: string, required = false): string => {
    const base =
      s.timestamp === "integer"
        ? `int(${q(columnName)})`
        : `bigint(${q(columnName)}, { mode: "number" })`;
    return required ? `${base}.notNull()` : base;
  };

  const rawFieldLine = spec.storeRaw ? `\n    raw: text(${q(c.raw)}),` : "";

  return `export const deliveryTrackingTable = mysqlTable(
  ${q(spec.tableName)},
  {
    messageId: ${messageId},
    providerId: ${idField(c.providerId)},
    providerMessageId: ${idField(c.providerMessageId)},
    type: ${shortTextField(c.type, true)},
    to: ${shortTextField(c.to, true)},
    from: ${shortTextField(c.from, false)},
    status: ${shortTextField(c.status, true)},
    providerStatusCode: ${shortTextField(c.providerStatusCode, false)},
    providerStatusMessage: ${shortTextField(c.providerStatusMessage, false)},
    sentAt: ${timestampField(c.sentAt)},
    deliveredAt: ${timestampField(c.deliveredAt)},
    failedAt: ${timestampField(c.failedAt)},
    requestedAt: ${timestampField(c.requestedAt, true)},
    scheduledAt: ${timestampField(c.scheduledAt)},
    statusUpdatedAt: ${timestampField(c.statusUpdatedAt, true)},
    attemptCount: int(${q(c.attemptCount)}).notNull().default(0),
    lastCheckedAt: ${timestampField(c.lastCheckedAt)},
    nextCheckAt: ${timestampField(c.nextCheckAt, true)},
    lastError: text(${q(c.lastError)}),${rawFieldLine}
    metadata: text(${q(c.metadata)}),
  },
  (table) => [
    index(${q(spec.indexNames.due)}).on(table.status, table.nextCheckAt),
    index(${q(spec.indexNames.providerMessage)}).on(
      table.providerId,
      table.providerMessageId,
    ),
    index(${q(spec.indexNames.requestedAt)}).on(table.requestedAt),
  ],
);`;
}

function renderMySqlQueueSchema(tableName: string): string {
  return `export const jobQueueTable = mysqlTable(
  ${q(tableName)},
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    type: varchar("type", { length: 128 }).notNull(),
    data: text("data").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    priority: int("priority").notNull().default(0),
    attempts: int("attempts").notNull().default(0),
    maxAttempts: int("max_attempts").notNull().default(3),
    delay: int("delay").notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    processAt: bigint("process_at", { mode: "number" }).notNull(),
    completedAt: bigint("completed_at", { mode: "number" }),
    failedAt: bigint("failed_at", { mode: "number" }),
    error: text("error"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_kmsg_jobs_dequeue").on(
      table.status,
      table.priority,
      table.processAt,
      table.createdAt,
    ),
    index("idx_kmsg_jobs_id").on(table.id),
  ],
);`;
}

function renderSqliteTrackingSchema(
  options: RenderDrizzleSchemaSourceOptions,
): string {
  const trackingTypeStrategy =
    options.typeStrategy ?? options.trackingTypeStrategy;
  const spec = getDeliveryTrackingSchemaSpec({
    tableName: options.trackingTableName,
    columnMap: options.trackingColumnMap,
    typeStrategy: trackingTypeStrategy,
    storeRaw: options.trackingStoreRaw,
    indexNames: options.indexNames,
    trackingIndexNames: options.trackingIndexNames,
  });
  const c = spec.columnMap;

  const rawFieldLine = spec.storeRaw ? `\n    raw: text(${q(c.raw)}),` : "";

  return `export const deliveryTrackingTable = sqliteTable(
  ${q(spec.tableName)},
  {
    messageId: text(${q(c.messageId)}).primaryKey(),
    providerId: text(${q(c.providerId)}).notNull(),
    providerMessageId: text(${q(c.providerMessageId)}).notNull(),
    type: text(${q(c.type)}).notNull(),
    to: text(${q(c.to)}).notNull(),
    from: text(${q(c.from)}),
    status: text(${q(c.status)}).notNull(),
    providerStatusCode: text(${q(c.providerStatusCode)}),
    providerStatusMessage: text(${q(c.providerStatusMessage)}),
    sentAt: integer(${q(c.sentAt)}),
    deliveredAt: integer(${q(c.deliveredAt)}),
    failedAt: integer(${q(c.failedAt)}),
    requestedAt: integer(${q(c.requestedAt)}).notNull(),
    scheduledAt: integer(${q(c.scheduledAt)}),
    statusUpdatedAt: integer(${q(c.statusUpdatedAt)}).notNull(),
    attemptCount: integer(${q(c.attemptCount)}).notNull().default(0),
    lastCheckedAt: integer(${q(c.lastCheckedAt)}),
    nextCheckAt: integer(${q(c.nextCheckAt)}).notNull(),
    lastError: text(${q(c.lastError)}),${rawFieldLine}
    metadata: text(${q(c.metadata)}),
  },
  (table) => [
    index(${q(spec.indexNames.due)}).on(table.status, table.nextCheckAt),
    index(${q(spec.indexNames.providerMessage)}).on(
      table.providerId,
      table.providerMessageId,
    ),
    index(${q(spec.indexNames.requestedAt)}).on(table.requestedAt),
  ],
);`;
}

function renderSqliteQueueSchema(tableName: string): string {
  return `export const jobQueueTable = sqliteTable(
  ${q(tableName)},
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    data: text("data").notNull(),
    status: text("status").notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    delay: integer("delay").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    processAt: integer("process_at").notNull(),
    completedAt: integer("completed_at"),
    failedAt: integer("failed_at"),
    error: text("error"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_kmsg_jobs_dequeue").on(
      table.status,
      table.priority,
      table.processAt,
      table.createdAt,
    ),
    index("idx_kmsg_jobs_id").on(table.id),
  ],
);`;
}

export function renderDrizzleSchemaSource(
  options: RenderDrizzleSchemaSourceOptions,
): string {
  const target = toSchemaTarget(options.target);
  const queueTableName = options.queueTableName ?? DEFAULT_JOB_QUEUE_TABLE;
  const sections: string[] = [];

  if (options.dialect === "postgres") {
    sections.push(
      'import { bigint, index, integer, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";',
    );
    if (target === "tracking" || target === "both") {
      sections.push(renderPostgresTrackingSchema(options));
    }
    if (target === "queue" || target === "both") {
      sections.push(renderPostgresQueueSchema(queueTableName));
    }
    return `// Generated by @k-msg/messaging\n${sections.join("\n\n")}\n`;
  }

  if (options.dialect === "mysql") {
    sections.push(
      'import { bigint, index, int, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";',
    );
    if (target === "tracking" || target === "both") {
      sections.push(renderMySqlTrackingSchema(options));
    }
    if (target === "queue" || target === "both") {
      sections.push(renderMySqlQueueSchema(queueTableName));
    }
    return `// Generated by @k-msg/messaging\n${sections.join("\n\n")}\n`;
  }

  sections.push(
    'import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";',
  );
  if (target === "tracking" || target === "both") {
    sections.push(renderSqliteTrackingSchema(options));
  }
  if (target === "queue" || target === "both") {
    sections.push(renderSqliteQueueSchema(queueTableName));
  }
  return `// Generated by @k-msg/messaging\n${sections.join("\n\n")}\n`;
}
