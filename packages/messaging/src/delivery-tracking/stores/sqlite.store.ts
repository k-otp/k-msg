import Database from "bun:sqlite";
import type { DeliveryTrackingSchemaOptions } from "../../adapters/cloudflare/delivery-tracking-schema";
import {
  HyperdriveDeliveryTrackingStore,
  type HyperdriveDeliveryTrackingStoreOptions,
} from "../../adapters/cloudflare/hyperdrive-delivery-tracking.store";
import { createCloudflareSqlClient } from "../../adapters/cloudflare/sql-client";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../store.interface";
import type { TrackingRecord } from "../types";

export interface SqliteDeliveryTrackingStoreOptions
  extends DeliveryTrackingSchemaOptions {
  dbPath?: string;
}

function isSelectLikeStatement(statement: string): boolean {
  return /^\s*(SELECT|WITH|PRAGMA)\b/i.test(statement);
}

export class SqliteDeliveryTrackingStore implements DeliveryTrackingStore {
  private readonly db: Database;
  private readonly delegate: HyperdriveDeliveryTrackingStore;
  private closed = false;

  constructor(options: SqliteDeliveryTrackingStoreOptions = {}) {
    this.db = new Database(options.dbPath ?? "./kmsg.sqlite");

    const schemaOptions: HyperdriveDeliveryTrackingStoreOptions = {
      tableName: options.tableName,
      columnMap: options.columnMap,
      typeStrategy: options.typeStrategy,
      storeRaw: options.storeRaw,
    };

    const client = createCloudflareSqlClient({
      dialect: "sqlite",
      query: async <T = Record<string, unknown>>(
        statement: string,
        params: readonly unknown[] = [],
      ) => {
        const values = [...params];
        const bindings = values as unknown as [];
        if (isSelectLikeStatement(statement)) {
          const rows = this.db.prepare(statement).all(...bindings) as T[];
          return { rows, rowCount: rows.length };
        }

        if (values.length === 0) {
          this.db.exec(statement);
          return { rows: [] as T[] };
        }

        const result = this.db.prepare(statement).run(...bindings) as {
          changes?: number;
        };
        return {
          rows: [] as T[],
          rowCount:
            typeof result.changes === "number" ? result.changes : undefined,
        };
      },
      close: () => {
        if (this.closed) return;
        this.closed = true;
        this.db.close();
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

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.db.close();
  }
}
