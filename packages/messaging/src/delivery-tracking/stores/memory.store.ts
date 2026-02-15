import type { DeliveryTrackingStore } from "../store.interface";
import { isTerminalDeliveryStatus, type TrackingRecord } from "../types";

function cloneRecord(record: TrackingRecord): TrackingRecord {
  return {
    ...record,
    requestedAt: new Date(record.requestedAt),
    scheduledAt: record.scheduledAt ? new Date(record.scheduledAt) : undefined,
    statusUpdatedAt: new Date(record.statusUpdatedAt),
    lastCheckedAt: record.lastCheckedAt ? new Date(record.lastCheckedAt) : undefined,
    nextCheckAt: new Date(record.nextCheckAt),
    lastError: record.lastError ? { ...record.lastError } : undefined,
    metadata: record.metadata ? { ...record.metadata } : undefined,
  };
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
    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;

    for (const record of this.records.values()) {
      if (isTerminalDeliveryStatus(record.status)) continue;
      if (record.nextCheckAt.getTime() > nowMs) continue;
      due.push(cloneRecord(record));
    }

    due.sort((a, b) => a.nextCheckAt.getTime() - b.nextCheckAt.getTime());
    return safeLimit > 0 ? due.slice(0, safeLimit) : [];
  }

  async patch(messageId: string, patch: Partial<TrackingRecord>): Promise<void> {
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
