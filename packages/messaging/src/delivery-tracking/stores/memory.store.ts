import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "../store.interface";
import { isTerminalDeliveryStatus, type TrackingRecord } from "../types";

function cloneRecord(record: TrackingRecord): TrackingRecord {
  return {
    ...record,
    requestedAt: new Date(record.requestedAt),
    scheduledAt: record.scheduledAt ? new Date(record.scheduledAt) : undefined,
    statusUpdatedAt: new Date(record.statusUpdatedAt),
    sentAt: record.sentAt ? new Date(record.sentAt) : undefined,
    deliveredAt: record.deliveredAt ? new Date(record.deliveredAt) : undefined,
    failedAt: record.failedAt ? new Date(record.failedAt) : undefined,
    lastCheckedAt: record.lastCheckedAt
      ? new Date(record.lastCheckedAt)
      : undefined,
    nextCheckAt: new Date(record.nextCheckAt),
    lastError: record.lastError ? { ...record.lastError } : undefined,
    metadata: record.metadata ? { ...record.metadata } : undefined,
    metadataHashes: record.metadataHashes
      ? { ...record.metadataHashes }
      : undefined,
    toHash: record.toHash,
    toMasked: record.toMasked,
    fromHash: record.fromHash,
    fromMasked: record.fromMasked,
    cryptoKid: record.cryptoKid,
    cryptoVersion: record.cryptoVersion,
    cryptoState: record.cryptoState,
    retentionClass: record.retentionClass,
    retentionBucketYm: record.retentionBucketYm,
  };
}

function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
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
  )
    return false;

  const types = toArray(filter.type);
  if (types && !types.includes(record.type)) return false;

  const statuses = toArray(filter.status);
  if (statuses && !statuses.includes(record.status)) return false;

  const toHashes = toArray(filter.toHash);
  if (toHashes && !toHashes.includes(record.toHash ?? "")) return false;

  const fromHashes = toArray(filter.fromHash);
  if (fromHashes && !fromHashes.includes(record.fromHash ?? "")) return false;

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
  )
    return false;

  return true;
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

export class InMemoryDeliveryTrackingStore implements DeliveryTrackingStore {
  private readonly records = new Map<string, TrackingRecord>();

  async init(): Promise<void> {
    // no-op
  }

  async upsert(record: TrackingRecord): Promise<void> {
    this.records.set(record.messageId, cloneRecord(record));
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    const record = this.records.get(messageId);
    return record ? cloneRecord(record) : undefined;
  }

  async listDue(now: Date, limit: number): Promise<TrackingRecord[]> {
    const due: TrackingRecord[] = [];
    const nowMs = now.getTime();
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.floor(limit))
      : 0;

    for (const record of this.records.values()) {
      if (isTerminalDeliveryStatus(record.status)) continue;
      if (record.nextCheckAt.getTime() > nowMs) continue;
      due.push(cloneRecord(record));
    }

    due.sort((a, b) => a.nextCheckAt.getTime() - b.nextCheckAt.getTime());
    return safeLimit > 0 ? due.slice(0, safeLimit) : [];
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

    const all = Array.from(this.records.values()).filter((r) =>
      matchesFilter(r, options),
    );
    all.sort((a, b) => {
      const aKey =
        orderBy === "statusUpdatedAt" ? a.statusUpdatedAt : a.requestedAt;
      const bKey =
        orderBy === "statusUpdatedAt" ? b.statusUpdatedAt : b.requestedAt;
      return orderDirection === "asc"
        ? aKey.getTime() - bKey.getTime()
        : bKey.getTime() - aKey.getTime();
    });

    return all.slice(safeOffset, safeOffset + safeLimit).map(cloneRecord);
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    let count = 0;
    for (const record of this.records.values()) {
      if (matchesFilter(record, filter)) count++;
    }
    return count;
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const buckets = new Map<
      string,
      { key: Record<string, string>; count: number }
    >();

    for (const record of this.records.values()) {
      if (!matchesFilter(record, filter)) continue;

      const keyObj: Record<string, string> = {};
      for (const field of fields) {
        keyObj[field] = getGroupValue(record, field);
      }

      const keyStr = fields.map((f) => `${f}:${keyObj[f]}`).join("|");
      const existing = buckets.get(keyStr);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(keyStr, { key: keyObj, count: 1 });
      }
    }

    return Array.from(buckets.values()).map((v) => ({
      key: v.key,
      count: v.count,
    }));
  }

  async patch(
    messageId: string,
    patch: Partial<TrackingRecord>,
  ): Promise<void> {
    const existing = this.records.get(messageId);
    if (!existing) return;

    const merged: TrackingRecord = {
      ...existing,
      ...patch,
      messageId: existing.messageId,
    };

    // Normalize status transitions: never regress from terminal to non-terminal.
    if (
      isTerminalDeliveryStatus(existing.status) &&
      patch.status &&
      !isTerminalDeliveryStatus(patch.status)
    ) {
      merged.status = existing.status;
    }

    this.records.set(messageId, cloneRecord(merged));
  }
}
