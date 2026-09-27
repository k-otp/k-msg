import type { SQL } from "bun";
import type { DeliveryTrackingSchemaOptions } from "../../adapters/cloudflare/delivery-tracking-schema";
import { HyperdriveDeliveryTrackingStore } from "../../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import {
  type CloudflareSqlClient,
  createCloudflareSqlClient,
  type SqlDialect,
} from "../../adapters/cloudflare/sql-client";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingFieldCryptoOptions,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingRetentionConfig,
  DeliveryTrackingStore,
} from "../store.interface";
import type { TrackingRecord } from "../types";

export interface BunSqlDeliveryTrackingStoreOptions
  extends DeliveryTrackingSchemaOptions {
  sql?: SQL;
  options?: SQL.Options;
  fieldCrypto?: DeliveryTrackingFieldCryptoOptions;
  retention?: DeliveryTrackingRetentionConfig;
  /**
   * Whether the store creates its table and indexes on first use. Set it to
   * `false` when migrations create the schema.
   * @default true
   */
  initializeSchema?: boolean;
}

export class BunSqlDeliveryTrackingStore implements DeliveryTrackingStore {
  private readonly sql: SQL;
  private readonly ownsClient: boolean;
  private readonly delegate: HyperdriveDeliveryTrackingStore;
  private closed = false;

  constructor(options: BunSqlDeliveryTrackingStoreOptions = {}) {
    if (options.sql) {
      this.sql = options.sql;
      this.ownsClient = false;
    } else {
      this.sql = new Bun.SQL(
        options.options ?? { adapter: "sqlite", filename: ":memory:" },
      );
      this.ownsClient = true;
    }

    const dialect = this.inferDialect();
    const query =
      (runner: SQL): CloudflareSqlClient["query"] =>
      async <T = Record<string, unknown>>(
        statement: string,
        params: readonly unknown[] = [],
      ) => {
        const result = await runner.unsafe(statement, [...params]);
        if (Array.isArray(result)) {
          return { rows: result as T[], rowCount: result.length };
        }
        return { rows: [] as T[] };
      };

    const client = createCloudflareSqlClient({
      dialect,
      query: query(this.sql),
      // A MySQL lease reads and updates its rows in one transaction, which
      // holds their locks until the lease is written.
      transaction: <T>(
        fn: (tx: CloudflareSqlClient) => Promise<T>,
      ): Promise<T> =>
        this.sql.begin((tx) =>
          fn(createCloudflareSqlClient({ dialect, query: query(tx) })),
        ) as Promise<T>,
      close: async () => {
        if (this.closed || !this.ownsClient) return;
        this.closed = true;
        await this.sql.close();
      },
    });

    this.delegate = new HyperdriveDeliveryTrackingStore(client, options);
  }

  async init(): Promise<void> {
    await this.delegate.init();
  }

  async upsert(record: TrackingRecord): Promise<void> {
    await this.delegate.upsert(record);
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    return await this.delegate.get(messageId);
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    return await this.delegate.listDue(now, limit);
  }

  async leaseDue(
    now: Date,
    limit: number,
    leaseUntil: Date,
  ): Promise<TrackingRecord[] | undefined> {
    return await this.delegate.leaseDue(now, limit, leaseUntil);
  }

  async patchLeased(
    messageId: string,
    leaseUntil: Date,
    patch: Partial<TrackingRecord>,
  ): Promise<boolean> {
    return await this.delegate.patchLeased(messageId, leaseUntil, patch);
  }

  async releaseLeases(
    messageIds: readonly string[],
    leaseUntil: Date,
    nextCheckAt: Date,
  ): Promise<void> {
    await this.delegate.releaseLeases(messageIds, leaseUntil, nextCheckAt);
  }

  async listRecords(
    options: DeliveryTrackingListOptions,
  ): Promise<TrackingRecord[]> {
    return await this.delegate.listRecords(options);
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    return await this.delegate.countRecords(filter);
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    return await this.delegate.countBy(filter, groupBy);
  }

  async patch(
    messageId: string,
    patch: Partial<TrackingRecord>,
  ): Promise<void> {
    await this.delegate.patch(messageId, patch);
  }

  async close(): Promise<void> {
    await this.delegate.close();
  }

  private inferDialect(): SqlDialect {
    const adapter = this.sql.options?.adapter;
    if (adapter === "mysql" || adapter === "mariadb") return "mysql";
    if (adapter === "postgres") return "postgres";
    return "sqlite";
  }
}
