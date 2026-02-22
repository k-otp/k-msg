import {
  type DeliveryTrackingColumnMap,
  type DeliveryTrackingSchemaOptions,
  type DeliveryTrackingTypeStrategy,
  getDeliveryTrackingSchemaSpec,
} from "./delivery-tracking-schema";
import {
  type RenderDrizzleSchemaSourceOptions,
  renderDrizzleSchemaSource,
} from "./drizzle-schema";
import { HyperdriveDeliveryTrackingStore } from "./hyperdrive-delivery-tracking.store";
import { HyperdriveJobQueue } from "./hyperdrive-job-queue";
import { CloudflareObjectDeliveryTrackingStore } from "./object-delivery-tracking.store";
import { CloudflareObjectJobQueue } from "./object-job-queue";
import {
  type CloudflareDurableObjectStorageLike,
  type CloudflareKvNamespaceLike,
  type CloudflareObjectStorage,
  type CloudflareR2BucketLike,
  createDurableObjectStorage,
  createKvObjectStorage,
  createR2ObjectStorage,
} from "./object-storage";
import {
  type CloudflareSqlClient,
  type CloudflareSqlQueryResult,
  type CreateDrizzleSqlClientOptions,
  createCloudflareSqlClient,
  createD1SqlClient,
  createDrizzleSqlClient,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
  type DrizzleSqlDatabaseLike,
  runCloudflareSqlTransaction,
  type SqlDialect,
} from "./sql-client";
import {
  type BuildCloudflareSqlSchemaSqlOptions,
  type BuildDeliveryTrackingSchemaSqlOptions,
  type BuildJobQueueSchemaSqlOptions,
  buildCloudflareSqlSchemaSql,
  buildDeliveryTrackingSchemaSql,
  buildJobQueueSchemaSql,
  type CloudflareSqlSchemaTarget,
  type InitializeCloudflareSqlSchemaOptions,
  initializeCloudflareSqlSchema,
} from "./sql-schema";

export {
  HyperdriveDeliveryTrackingStore,
  HyperdriveJobQueue,
  CloudflareObjectDeliveryTrackingStore,
  CloudflareObjectJobQueue,
  createD1SqlClient,
  createDrizzleSqlClient,
  createCloudflareSqlClient,
  runCloudflareSqlTransaction,
  createKvObjectStorage,
  createR2ObjectStorage,
  createDurableObjectStorage,
  buildDeliveryTrackingSchemaSql,
  buildJobQueueSchemaSql,
  buildCloudflareSqlSchemaSql,
  initializeCloudflareSqlSchema,
  renderDrizzleSchemaSource,
  getDeliveryTrackingSchemaSpec,
};

export type {
  CloudflareSqlClient,
  CloudflareSqlQueryResult,
  SqlDialect,
  CreateDrizzleSqlClientOptions,
  DrizzleSqlDatabaseLike,
  D1DatabaseLike,
  D1PreparedStatementLike,
  CloudflareObjectStorage,
  CloudflareKvNamespaceLike,
  CloudflareR2BucketLike,
  CloudflareDurableObjectStorageLike,
  BuildDeliveryTrackingSchemaSqlOptions,
  BuildJobQueueSchemaSqlOptions,
  BuildCloudflareSqlSchemaSqlOptions,
  InitializeCloudflareSqlSchemaOptions,
  CloudflareSqlSchemaTarget,
  RenderDrizzleSchemaSourceOptions,
  DeliveryTrackingSchemaOptions,
  DeliveryTrackingColumnMap,
  DeliveryTrackingTypeStrategy,
};

export interface CreateDrizzleDeliveryTrackingStoreOptions
  extends CreateDrizzleSqlClientOptions,
    DeliveryTrackingSchemaOptions {}

export interface CreateD1DeliveryTrackingStoreOptions
  extends DeliveryTrackingSchemaOptions {}

export interface CreateDrizzleJobQueueOptions
  extends CreateDrizzleSqlClientOptions {
  tableName?: string;
}

export function createD1DeliveryTrackingStore(
  database: D1DatabaseLike,
  options: CreateD1DeliveryTrackingStoreOptions = {},
): HyperdriveDeliveryTrackingStore {
  return new HyperdriveDeliveryTrackingStore(createD1SqlClient(database), {
    tableName: options.tableName,
    columnMap: options.columnMap,
    typeStrategy: options.typeStrategy ?? options.trackingTypeStrategy,
    storeRaw: options.storeRaw,
  });
}

export function createD1JobQueue<T>(
  database: D1DatabaseLike,
  options: { tableName?: string } = {},
): HyperdriveJobQueue<T> {
  return new HyperdriveJobQueue<T>(
    createD1SqlClient(database),
    options.tableName,
  );
}

export function createDrizzleDeliveryTrackingStore(
  options: CreateDrizzleDeliveryTrackingStoreOptions,
): HyperdriveDeliveryTrackingStore {
  const client = createDrizzleSqlClient(options);
  return new HyperdriveDeliveryTrackingStore(client, {
    tableName: options.tableName,
    columnMap: options.columnMap,
    typeStrategy: options.typeStrategy ?? options.trackingTypeStrategy,
    storeRaw: options.storeRaw,
  });
}

export function createDrizzleJobQueue<T>(
  options: CreateDrizzleJobQueueOptions,
): HyperdriveJobQueue<T> {
  const client = createDrizzleSqlClient(options);
  return new HyperdriveJobQueue<T>(client, options.tableName);
}

export function createKvDeliveryTrackingStore(
  namespace: CloudflareKvNamespaceLike,
  options: { keyPrefix?: string } = {},
): CloudflareObjectDeliveryTrackingStore {
  return new CloudflareObjectDeliveryTrackingStore(
    createKvObjectStorage(namespace),
    options.keyPrefix,
  );
}

export function createKvJobQueue<T>(
  namespace: CloudflareKvNamespaceLike,
  options: { keyPrefix?: string } = {},
): CloudflareObjectJobQueue<T> {
  return new CloudflareObjectJobQueue<T>(
    createKvObjectStorage(namespace),
    options.keyPrefix,
  );
}

export function createR2DeliveryTrackingStore(
  bucket: CloudflareR2BucketLike,
  options: { keyPrefix?: string } = {},
): CloudflareObjectDeliveryTrackingStore {
  return new CloudflareObjectDeliveryTrackingStore(
    createR2ObjectStorage(bucket),
    options.keyPrefix,
  );
}

export function createR2JobQueue<T>(
  bucket: CloudflareR2BucketLike,
  options: { keyPrefix?: string } = {},
): CloudflareObjectJobQueue<T> {
  return new CloudflareObjectJobQueue<T>(
    createR2ObjectStorage(bucket),
    options.keyPrefix,
  );
}

export function createDurableObjectDeliveryTrackingStore(
  storage: CloudflareDurableObjectStorageLike,
  options: { keyPrefix?: string } = {},
): CloudflareObjectDeliveryTrackingStore {
  return new CloudflareObjectDeliveryTrackingStore(
    createDurableObjectStorage(storage),
    options.keyPrefix,
  );
}

export function createDurableObjectJobQueue<T>(
  storage: CloudflareDurableObjectStorageLike,
  options: { keyPrefix?: string } = {},
): CloudflareObjectJobQueue<T> {
  return new CloudflareObjectJobQueue<T>(
    createDurableObjectStorage(storage),
    options.keyPrefix,
  );
}
