import type { TrackingRecord } from "./types";

export interface DeliveryTrackingStore {
  init(): Promise<void>;
  upsert(record: TrackingRecord): Promise<void>;
  get(messageId: string): Promise<TrackingRecord | undefined>;
  listDue(now: Date, limit: number): Promise<TrackingRecord[]>;
  patch(messageId: string, patch: Partial<TrackingRecord>): Promise<void>;
  close?(): Promise<void> | void;
}
