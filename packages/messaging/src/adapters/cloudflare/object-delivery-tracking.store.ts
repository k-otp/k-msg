import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../../delivery-tracking/store.interface";
import {
  isTerminalDeliveryStatus,
  type TrackingRecord,
} from "../../delivery-tracking/types";
import type { CloudflareObjectStorage } from "./object-storage";

interface StoredTrackingRecord {
  messageId: string;
  providerId: string;
  providerMessageId: string;
  type: TrackingRecord["type"];
  to: string;
  from?: string;
  requestedAt: number;
  scheduledAt?: number;
  status: TrackingRecord["status"];
  providerStatusCode?: string;
  providerStatusMessage?: string;
  sentAt?: number;
  deliveredAt?: number;
  failedAt?: number;
  statusUpdatedAt: number;
  attemptCount: number;
  lastCheckedAt?: number;
  nextCheckAt: number;
  lastError?: TrackingRecord["lastError"];
  raw?: unknown;
  metadata?: Record<string, unknown>;
}

function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

function getGroupValue(
  record: TrackingRecord,
  field: DeliveryTrackingCountByField,
): string {
  switch (field) {
    case "providerId":
      return record.providerId;
    case "type":
      return record.type;
    case "status":
      return record.status;
  }
}

function matchesFilter(
  record: TrackingRecord,
  filter: DeliveryTrackingRecordFilter,
): boolean {
  const messageIds = toArray(filter.messageId);
  if (messageIds && !messageIds.includes(record.messageId)) return false;

  const providerIds = toArray(filter.providerId);
  if (providerIds && !providerIds.includes(record.providerId)) return false;

  const providerMessageIds = toArray(filter.providerMessageId);
  if (
    providerMessageIds &&
    !providerMessageIds.includes(record.providerMessageId)
  ) {
    return false;
  }

  const types = toArray(filter.type);
  if (types && !types.includes(record.type)) return false;

  const statuses = toArray(filter.status);
  if (statuses && !statuses.includes(record.status)) return false;

  const tos = toArray(filter.to);
  if (tos && !tos.includes(record.to)) return false;

  const froms = toArray(filter.from);
  if (froms && !froms.includes(record.from ?? "")) return false;

  if (filter.requestedAtFrom && record.requestedAt < filter.requestedAtFrom)
    return false;
  if (filter.requestedAtTo && record.requestedAt > filter.requestedAtTo)
    return false;

  if (
    filter.statusUpdatedAtFrom &&
    record.statusUpdatedAt < filter.statusUpdatedAtFrom
  ) {
    return false;
  }
  if (
    filter.statusUpdatedAtTo &&
    record.statusUpdatedAt > filter.statusUpdatedAtTo
  ) {
    return false;
  }

  return true;
}

export class CloudflareObjectDeliveryTrackingStore
  implements DeliveryTrackingStore
{
  constructor(
    private readonly storage: CloudflareObjectStorage,
    private readonly keyPrefix = "kmsg/delivery-tracking",
  ) {}

  async init(): Promise<void> {
    // no-op
  }

  async upsert(record: TrackingRecord): Promise<void> {
    const normalized = this.serializeRecord(record);
    await this.storage.put(
      this.recordKey(record.messageId),
      JSON.stringify(normalized),
    );
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    const raw = await this.storage.get(this.recordKey(messageId));
    if (!raw) return undefined;
    return this.deserializeRecord(raw);
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;
    if (safeLimit === 0) return [];

    const keys = await this.storage.list(this.recordPrefix());
    const due: TrackingRecord[] = [];

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = this.deserializeRecord(raw);
      if (!record) continue;
      if (isTerminalDeliveryStatus(record.status)) continue;
      if (record.nextCheckAt.getTime() > now.getTime()) continue;
      due.push(record);
    }

    due.sort((a, b) => a.nextCheckAt.getTime() - b.nextCheckAt.getTime());
    return due.slice(0, safeLimit);
  }

  async listRecords(
    options: DeliveryTrackingListOptions,
  ): Promise<TrackingRecord[]> {
    const safeLimit = Number.isFinite(options.limit)
      ? Math.max(0, Math.floor(options.limit))
      : 0;
    if (safeLimit === 0) return [];

    const safeOffset = Number.isFinite(options.offset)
      ? Math.max(0, Math.floor(options.offset ?? 0))
      : 0;

    const orderBy = options.orderBy ?? "requestedAt";
    const orderDirection = options.orderDirection ?? "desc";

    const keys = await this.storage.list(this.recordPrefix());
    const records: TrackingRecord[] = [];

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = this.deserializeRecord(raw);
      if (!record) continue;
      if (!matchesFilter(record, options)) continue;
      records.push(record);
    }

    records.sort((a, b) => {
      const left =
        orderBy === "statusUpdatedAt" ? a.statusUpdatedAt : a.requestedAt;
      const right =
        orderBy === "statusUpdatedAt" ? b.statusUpdatedAt : b.requestedAt;
      return orderDirection === "asc"
        ? left.getTime() - right.getTime()
        : right.getTime() - left.getTime();
    });

    return records.slice(safeOffset, safeOffset + safeLimit);
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    const keys = await this.storage.list(this.recordPrefix());
    let count = 0;

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = this.deserializeRecord(raw);
      if (!record) continue;
      if (matchesFilter(record, filter)) count += 1;
    }

    return count;
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const keys = await this.storage.list(this.recordPrefix());
    const buckets = new Map<
      string,
      { key: Record<string, string>; count: number }
    >();

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = this.deserializeRecord(raw);
      if (!record) continue;
      if (!matchesFilter(record, filter)) continue;

      const bucketKey: Record<string, string> = {};
      for (const field of fields) {
        bucketKey[field] = getGroupValue(record, field);
      }

      const serialized = fields
        .map((field) => `${field}:${bucketKey[field]}`)
        .join("|");
      const existing = buckets.get(serialized);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(serialized, { key: bucketKey, count: 1 });
      }
    }

    return Array.from(buckets.values()).map((bucket) => ({
      key: bucket.key,
      count: bucket.count,
    }));
  }

  async patch(
    messageId: string,
    patch: Partial<TrackingRecord>,
  ): Promise<void> {
    const current = await this.get(messageId);
    if (!current) return;

    const next: TrackingRecord = {
      ...current,
      ...patch,
      messageId: current.messageId,
    };

    if (
      isTerminalDeliveryStatus(current.status) &&
      patch.status &&
      !isTerminalDeliveryStatus(patch.status)
    ) {
      next.status = current.status;
    }

    await this.upsert(next);
  }

  private serializeRecord(record: TrackingRecord): StoredTrackingRecord {
    return {
      ...record,
      requestedAt: record.requestedAt.getTime(),
      scheduledAt: record.scheduledAt?.getTime(),
      sentAt: record.sentAt?.getTime(),
      deliveredAt: record.deliveredAt?.getTime(),
      failedAt: record.failedAt?.getTime(),
      statusUpdatedAt: record.statusUpdatedAt.getTime(),
      lastCheckedAt: record.lastCheckedAt?.getTime(),
      nextCheckAt: record.nextCheckAt.getTime(),
    };
  }

  private deserializeRecord(raw: string): TrackingRecord | undefined {
    try {
      const parsed = JSON.parse(raw) as StoredTrackingRecord;
      return {
        ...parsed,
        requestedAt: new Date(parsed.requestedAt),
        scheduledAt:
          typeof parsed.scheduledAt === "number"
            ? new Date(parsed.scheduledAt)
            : undefined,
        sentAt:
          typeof parsed.sentAt === "number"
            ? new Date(parsed.sentAt)
            : undefined,
        deliveredAt:
          typeof parsed.deliveredAt === "number"
            ? new Date(parsed.deliveredAt)
            : undefined,
        failedAt:
          typeof parsed.failedAt === "number"
            ? new Date(parsed.failedAt)
            : undefined,
        statusUpdatedAt: new Date(parsed.statusUpdatedAt),
        lastCheckedAt:
          typeof parsed.lastCheckedAt === "number"
            ? new Date(parsed.lastCheckedAt)
            : undefined,
        nextCheckAt: new Date(parsed.nextCheckAt),
      };
    } catch {
      return undefined;
    }
  }

  private recordPrefix(): string {
    return `${this.keyPrefix}/records/`;
  }

  private recordKey(messageId: string): string {
    return `${this.recordPrefix()}${messageId}`;
  }
}
