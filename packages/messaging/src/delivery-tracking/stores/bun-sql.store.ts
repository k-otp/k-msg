import type { SQL } from "bun";
import type { DeliveryTrackingSchemaOptions } from "../../adapters/cloudflare/delivery-tracking-schema";
import {
  HyperdriveDeliveryTrackingStore,
  type HyperdriveDeliveryTrackingStoreOptions,
} from "../../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import {
  createCloudflareSqlClient,
  type SqlDialect,
} from "../../adapters/cloudflare/sql-client";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../store.interface";
import type { TrackingRecord } from "../types";

export interface BunSqlDeliveryTrackingStoreOptions
  extends DeliveryTrackingSchemaOptions {
  sql?: SQL;
  options?: SQL.Options;
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
    const schemaOptions: HyperdriveDeliveryTrackingStoreOptions = {
      tableName: options.tableName,
      columnMap: options.columnMap,
      typeStrategy: options.typeStrategy,
      storeRaw: options.storeRaw,
    };

    const client = createCloudflareSqlClient({
      dialect: this.inferDialect(),
      query: async <T = Record<string, unknown>>(
        statement: string,
        params: readonly unknown[] = [],
      ) => {
        const result = await this.sql.unsafe(statement, [...params]);
        if (Array.isArray(result)) {
          return { rows: result as T[], rowCount: result.length };
        }
        return { rows: [] as T[] };
      },
      close: async () => {
        if (this.closed || !this.ownsClient) return;
        this.closed = true;
        await this.sql.close();
      },
    });

    this.delegate = new HyperdriveDeliveryTrackingStore(client, schemaOptions);
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
