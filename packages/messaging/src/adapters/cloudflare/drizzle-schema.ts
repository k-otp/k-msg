import type { SqlDialect } from "./sql-client";
import {
  type CloudflareSqlSchemaTarget,
  DEFAULT_DELIVERY_TRACKING_TABLE,
  DEFAULT_JOB_QUEUE_TABLE,
} from "./sql-schema";

export interface RenderDrizzleSchemaSourceOptions {
  dialect: SqlDialect;
  target?: CloudflareSqlSchemaTarget;
  trackingTableName?: string;
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

function renderPostgresTrackingSchema(tableName: string): string {
  return `export const deliveryTrackingTable = pgTable(
  ${q(tableName)},
  {
    messageId: text("message_id").primaryKey(),
    providerId: text("provider_id").notNull(),
    providerMessageId: text("provider_message_id").notNull(),
    type: varchar("type", { length: 64 }).notNull(),
    to: varchar("to", { length: 64 }).notNull(),
    from: varchar("from", { length: 64 }),
    status: varchar("status", { length: 64 }).notNull(),
    providerStatusCode: varchar("provider_status_code", { length: 64 }),
    providerStatusMessage: varchar("provider_status_message", { length: 64 }),
    sentAt: bigint("sent_at", { mode: "number" }),
    deliveredAt: bigint("delivered_at", { mode: "number" }),
    failedAt: bigint("failed_at", { mode: "number" }),
    requestedAt: bigint("requested_at", { mode: "number" }).notNull(),
    scheduledAt: bigint("scheduled_at", { mode: "number" }),
    statusUpdatedAt: bigint("status_updated_at", { mode: "number" }).notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastCheckedAt: bigint("last_checked_at", { mode: "number" }),
    nextCheckAt: bigint("next_check_at", { mode: "number" }).notNull(),
    lastError: jsonb("last_error"),
    raw: jsonb("raw"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("idx_kmsg_delivery_due").on(table.status, table.nextCheckAt),
    index("idx_kmsg_delivery_provider_msg").on(
      table.providerId,
      table.providerMessageId,
    ),
    index("idx_kmsg_delivery_requested_at").on(table.requestedAt),
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

function renderMySqlTrackingSchema(tableName: string): string {
  return `export const deliveryTrackingTable = mysqlTable(
  ${q(tableName)},
  {
    messageId: varchar("message_id", { length: 255 }).primaryKey(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    providerMessageId: varchar("provider_message_id", { length: 255 }).notNull(),
    type: varchar("type", { length: 64 }).notNull(),
    to: varchar("to", { length: 64 }).notNull(),
    from: varchar("from", { length: 64 }),
    status: varchar("status", { length: 64 }).notNull(),
    providerStatusCode: varchar("provider_status_code", { length: 64 }),
    providerStatusMessage: varchar("provider_status_message", { length: 64 }),
    sentAt: bigint("sent_at", { mode: "number" }),
    deliveredAt: bigint("delivered_at", { mode: "number" }),
    failedAt: bigint("failed_at", { mode: "number" }),
    requestedAt: bigint("requested_at", { mode: "number" }).notNull(),
    scheduledAt: bigint("scheduled_at", { mode: "number" }),
    statusUpdatedAt: bigint("status_updated_at", { mode: "number" }).notNull(),
    attemptCount: int("attempt_count").notNull().default(0),
    lastCheckedAt: bigint("last_checked_at", { mode: "number" }),
    nextCheckAt: bigint("next_check_at", { mode: "number" }).notNull(),
    lastError: text("last_error"),
    raw: text("raw"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_kmsg_delivery_due").on(table.status, table.nextCheckAt),
    index("idx_kmsg_delivery_provider_msg").on(
      table.providerId,
      table.providerMessageId,
    ),
    index("idx_kmsg_delivery_requested_at").on(table.requestedAt),
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

function renderSqliteTrackingSchema(tableName: string): string {
  return `export const deliveryTrackingTable = sqliteTable(
  ${q(tableName)},
  {
    messageId: text("message_id").primaryKey(),
    providerId: text("provider_id").notNull(),
    providerMessageId: text("provider_message_id").notNull(),
    type: text("type").notNull(),
    to: text("to").notNull(),
    from: text("from"),
    status: text("status").notNull(),
    providerStatusCode: text("provider_status_code"),
    providerStatusMessage: text("provider_status_message"),
    sentAt: integer("sent_at"),
    deliveredAt: integer("delivered_at"),
    failedAt: integer("failed_at"),
    requestedAt: integer("requested_at").notNull(),
    scheduledAt: integer("scheduled_at"),
    statusUpdatedAt: integer("status_updated_at").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastCheckedAt: integer("last_checked_at"),
    nextCheckAt: integer("next_check_at").notNull(),
    lastError: text("last_error"),
    raw: text("raw"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_kmsg_delivery_due").on(table.status, table.nextCheckAt),
    index("idx_kmsg_delivery_provider_msg").on(
      table.providerId,
      table.providerMessageId,
    ),
    index("idx_kmsg_delivery_requested_at").on(table.requestedAt),
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
  const trackingTableName =
    options.trackingTableName ?? DEFAULT_DELIVERY_TRACKING_TABLE;
  const queueTableName = options.queueTableName ?? DEFAULT_JOB_QUEUE_TABLE;
  const sections: string[] = [];

  if (options.dialect === "postgres") {
    sections.push(
      'import { bigint, index, integer, jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";',
    );
    if (target === "tracking" || target === "both") {
      sections.push(renderPostgresTrackingSchema(trackingTableName));
    }
    if (target === "queue" || target === "both") {
      sections.push(renderPostgresQueueSchema(queueTableName));
    }
    return `// Generated by @k-msg/messaging
${sections.join("\n\n")}
`;
  }

  if (options.dialect === "mysql") {
    sections.push(
      'import { bigint, index, int, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";',
    );
    if (target === "tracking" || target === "both") {
      sections.push(renderMySqlTrackingSchema(trackingTableName));
    }
    if (target === "queue" || target === "both") {
      sections.push(renderMySqlQueueSchema(queueTableName));
    }
    return `// Generated by @k-msg/messaging
${sections.join("\n\n")}
`;
  }

  sections.push(
    'import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";',
  );
  if (target === "tracking" || target === "both") {
    sections.push(renderSqliteTrackingSchema(trackingTableName));
  }
  if (target === "queue" || target === "both") {
    sections.push(renderSqliteQueueSchema(queueTableName));
  }
  return `// Generated by @k-msg/messaging
${sections.join("\n\n")}
`;
}
