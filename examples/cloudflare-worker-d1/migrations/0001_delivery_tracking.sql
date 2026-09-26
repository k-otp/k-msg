-- Delivery tracking table for createD1DeliveryTrackingStore (@k-msg/messaging).
-- Generated, not hand-written. Either command prints the same SQL:
--   k-msg db schema print --dialect sqlite --target tracking --format sql
--   buildDeliveryTrackingSchemaSql({ dialect: "sqlite" })
--     from @k-msg/messaging/adapters/cloudflare

CREATE TABLE IF NOT EXISTS "kmsg_delivery_tracking" (
  "message_id" TEXT PRIMARY KEY,
  "provider_id" TEXT NOT NULL,
  "provider_message_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "from" TEXT,
  "status" TEXT NOT NULL,
  "provider_status_code" TEXT,
  "provider_status_message" TEXT,
  "sent_at" INTEGER,
  "delivered_at" INTEGER,
  "failed_at" INTEGER,
  "requested_at" INTEGER NOT NULL,
  "scheduled_at" INTEGER,
  "status_updated_at" INTEGER NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_checked_at" INTEGER,
  "next_check_at" INTEGER NOT NULL,
  "last_error" TEXT,
  "metadata" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_kmsg_delivery_due" ON "kmsg_delivery_tracking" ("status", "next_check_at");

CREATE INDEX IF NOT EXISTS "idx_kmsg_delivery_provider_msg" ON "kmsg_delivery_tracking" ("provider_id", "provider_message_id");

CREATE INDEX IF NOT EXISTS "idx_kmsg_delivery_requested_at" ON "kmsg_delivery_tracking" ("requested_at");
