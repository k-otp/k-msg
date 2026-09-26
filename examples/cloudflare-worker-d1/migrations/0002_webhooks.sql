-- Webhook endpoint and delivery tables for createD1WebhookPersistence
-- (@k-msg/webhook). Generated, not hand-written, with buildWebhookSchemaSql()
-- from @k-msg/webhook/adapters/cloudflare; each statement gets a semicolon.

CREATE TABLE IF NOT EXISTS kmsg_webhook_endpoints (
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
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_kmsg_webhook_endpoints_url
      ON kmsg_webhook_endpoints(url);

CREATE TABLE IF NOT EXISTS kmsg_webhook_deliveries (
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
    );

CREATE INDEX IF NOT EXISTS idx_kmsg_webhook_deliveries_endpoint_id
      ON kmsg_webhook_deliveries(endpoint_id);

CREATE INDEX IF NOT EXISTS idx_kmsg_webhook_deliveries_created_at
      ON kmsg_webhook_deliveries(created_at DESC);
