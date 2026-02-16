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
  createCloudflareSqlClient,
  createD1SqlClient,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
  runCloudflareSqlTransaction,
  type SqlDialect,
} from "./sql-client";

export {
  HyperdriveDeliveryTrackingStore,
  HyperdriveJobQueue,
  CloudflareObjectDeliveryTrackingStore,
  CloudflareObjectJobQueue,
  createD1SqlClient,
  createCloudflareSqlClient,
  runCloudflareSqlTransaction,
  createKvObjectStorage,
  createR2ObjectStorage,
  createDurableObjectStorage,
};

export type {
  CloudflareSqlClient,
  CloudflareSqlQueryResult,
  SqlDialect,
  D1DatabaseLike,
  D1PreparedStatementLike,
  CloudflareObjectStorage,
  CloudflareKvNamespaceLike,
  CloudflareR2BucketLike,
  CloudflareDurableObjectStorageLike,
};

export function createD1DeliveryTrackingStore(
  database: D1DatabaseLike,
  options: { tableName?: string } = {},
): HyperdriveDeliveryTrackingStore {
  return new HyperdriveDeliveryTrackingStore(
    createD1SqlClient(database),
    options.tableName,
  );
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
