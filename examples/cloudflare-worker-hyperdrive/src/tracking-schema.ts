import {
  buildDeliveryTrackingSchemaSql,
  type DeliveryTrackingSchemaOptions,
} from "@k-msg/messaging/adapters/cloudflare";

/**
 * The delivery tracking table. The store reads and writes with these options
 * and sql/schema.sql is generated from them, so the two cannot drift apart.
 */
export const TRACKING_SCHEMA = {
  tableName: "kmsg_delivery_tracking",
  typeStrategy: {
    // TIMESTAMPTZ instead of epoch-millisecond BIGINT, readable in psql.
    timestamp: "date",
    // TEXT instead of VARCHAR(64): a longer provider status message would
    // make the status update, and with it the cron run, fail.
    shortText: "text",
    // TEXT instead of JSONB: the store passes JSON it already serialized and
    // postgres.js would encode it again, storing JSON strings that SQL JSON
    // operators cannot read.
    json: "text",
  },
} as const satisfies DeliveryTrackingSchemaOptions;

/** The DDL in sql/schema.sql; scripts/print-schema.ts prints it. */
export function trackingSchemaSql(): string {
  return buildDeliveryTrackingSchemaSql({
    dialect: "postgres",
    ...TRACKING_SCHEMA,
  });
}
