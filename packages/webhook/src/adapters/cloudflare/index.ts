import type { WebhookPersistence } from "../../runtime/types";
import type { D1DatabaseLike } from "./d1-client";
import { D1WebhookDeliveryStore } from "./d1-delivery.store";
import { D1WebhookEndpointStore } from "./d1-endpoint.store";
import {
  buildWebhookSchemaSql,
  DEFAULT_WEBHOOK_DELIVERY_TABLE,
  DEFAULT_WEBHOOK_ENDPOINT_TABLE,
  initializeWebhookSchema,
  type WebhookSchemaOptions,
} from "./sql-schema";

export type { D1DatabaseLike, D1PreparedStatementLike } from "./d1-client";
export {
  buildWebhookSchemaSql,
  DEFAULT_WEBHOOK_DELIVERY_TABLE,
  DEFAULT_WEBHOOK_ENDPOINT_TABLE,
  initializeWebhookSchema,
};
export type { WebhookSchemaOptions };

export interface CreateD1WebhookPersistenceOptions
  extends WebhookSchemaOptions {
  initializeSchema?: boolean;
}

export function createD1WebhookPersistence(
  db: D1DatabaseLike,
  options: CreateD1WebhookPersistenceOptions = {},
): WebhookPersistence {
  const endpointTableName =
    options.endpointTableName ?? DEFAULT_WEBHOOK_ENDPOINT_TABLE;
  const deliveryTableName =
    options.deliveryTableName ?? DEFAULT_WEBHOOK_DELIVERY_TABLE;
  const shouldInitialize = options.initializeSchema !== false;

  let initPromise: Promise<void> | null = null;

  const ensureInitialized = async (): Promise<void> => {
    if (!shouldInitialize) {
      return;
    }

    if (!initPromise) {
      initPromise = initializeWebhookSchema(db, {
        endpointTableName,
        deliveryTableName,
      }).catch((error) => {
        initPromise = null;
        throw error;
      });
    }

    await initPromise;
  };

  return {
    endpointStore: new D1WebhookEndpointStore(
      db,
      endpointTableName,
      ensureInitialized,
    ),
    deliveryStore: new D1WebhookDeliveryStore(
      db,
      deliveryTableName,
      ensureInitialized,
    ),
    init: ensureInitialized,
  };
}
