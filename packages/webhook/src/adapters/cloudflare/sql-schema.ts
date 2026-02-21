import { type D1DatabaseLike, runStatements } from "./d1-client";

export const DEFAULT_WEBHOOK_ENDPOINT_TABLE = "kmsg_webhook_endpoints";
export const DEFAULT_WEBHOOK_DELIVERY_TABLE = "kmsg_webhook_deliveries";

export interface WebhookSchemaOptions {
  endpointTableName?: string;
  deliveryTableName?: string;
}

function resolveTables(options: WebhookSchemaOptions = {}): {
  endpointTable: string;
  deliveryTable: string;
} {
  return {
    endpointTable: options.endpointTableName ?? DEFAULT_WEBHOOK_ENDPOINT_TABLE,
    deliveryTable: options.deliveryTableName ?? DEFAULT_WEBHOOK_DELIVERY_TABLE,
  };
}

export function buildWebhookSchemaSql(
  options: WebhookSchemaOptions = {},
): string[] {
  const tables = resolveTables(options);

  return [
    `CREATE TABLE IF NOT EXISTS ${tables.endpointTable} (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      name TEXT,
      description TEXT,
      active INTEGER NOT NULL,
      events_json TEXT NOT NULL,
      headers_json TEXT,
      secret TEXT,
      retry_config_json TEXT,
      filters_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_triggered_at INTEGER,
      status TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_${tables.endpointTable}_url
      ON ${tables.endpointTable}(url)`,
    `CREATE TABLE IF NOT EXISTS ${tables.deliveryTable} (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      event_type TEXT,
      url TEXT NOT NULL,
      http_method TEXT NOT NULL,
      headers_json TEXT NOT NULL,
      payload TEXT NOT NULL,
      attempts_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      next_retry_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS idx_${tables.deliveryTable}_endpoint_id
      ON ${tables.deliveryTable}(endpoint_id)`,
    `CREATE INDEX IF NOT EXISTS idx_${tables.deliveryTable}_created_at
      ON ${tables.deliveryTable}(created_at DESC)`,
  ];
}

export async function initializeWebhookSchema(
  db: D1DatabaseLike,
  options: WebhookSchemaOptions = {},
): Promise<void> {
  await runStatements(db, buildWebhookSchemaSql(options));
}
