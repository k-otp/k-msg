import type { TrackingRecord } from "./types";

export type DeliveryTrackingRecordOrderBy = "requestedAt" | "statusUpdatedAt";
export type DeliveryTrackingRecordOrderDirection = "asc" | "desc";

export interface DeliveryTrackingRecordFilter {
  messageId?: string | string[];
  providerId?: string | string[];
  providerMessageId?: string | string[];
  type?: TrackingRecord["type"] | Array<TrackingRecord["type"]>;
  status?: TrackingRecord["status"] | Array<TrackingRecord["status"]>;
  to?: string | string[];
  from?: string | string[];
  requestedAtFrom?: Date;
  requestedAtTo?: Date;
  statusUpdatedAtFrom?: Date;
  statusUpdatedAtTo?: Date;
}

export interface DeliveryTrackingListOptions
  extends DeliveryTrackingRecordFilter {
  limit: number;
  offset?: number;
  orderBy?: DeliveryTrackingRecordOrderBy;
  orderDirection?: DeliveryTrackingRecordOrderDirection;
}

export type DeliveryTrackingCountByField = "providerId" | "type" | "status";

export type DeliveryTrackingCountByKey = Partial<
  Record<DeliveryTrackingCountByField, string>
>;

export interface DeliveryTrackingCountByRow {
  key: DeliveryTrackingCountByKey;
  count: number;
}

export interface DeliveryTrackingStore {
  init(): Promise<void>;
  upsert(record: TrackingRecord): Promise<void>;
  get(messageId: string): Promise<TrackingRecord | undefined>;
  listDue(now: Date, limit: number): Promise<TrackingRecord[]>;
  listRecords?(options: DeliveryTrackingListOptions): Promise<TrackingRecord[]>;
  countRecords?(filter: DeliveryTrackingRecordFilter): Promise<number>;
  countBy?(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]>;
  patch(messageId: string, patch: Partial<TrackingRecord>): Promise<void>;
  close?(): Promise<void> | void;
}
