import {
  applyTrackingCryptoOnWrite,
  normalizeTrackingFilterWithHashes,
  restoreTrackingCryptoOnRead,
  type TrackingCryptoMode,
} from "../../delivery-tracking/field-crypto";
import {
  resolveRetentionDays,
  toRetentionBucketYm,
} from "../../delivery-tracking/retention";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingFieldCryptoOptions,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingRetentionConfig,
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
  to?: string;
  toEnc?: string;
  toHash?: string;
  toMasked?: string;
  from?: string;
  fromEnc?: string;
  fromHash?: string;
  fromMasked?: string;
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
  metadataEnc?: string;
  metadataHashes?: Record<string, string>;
  cryptoKid?: string;
  cryptoVersion?: number;
  cryptoState?: TrackingRecord["cryptoState"];
  retentionClass?: TrackingRecord["retentionClass"];
  retentionBucketYm?: number;
}

export interface CloudflareObjectDeliveryTrackingStoreOptions {
  keyPrefix?: string;
  fieldCrypto?: DeliveryTrackingFieldCryptoOptions;
  retention?: DeliveryTrackingRetentionConfig;
  secureMode?: boolean;
  compatPlainColumns?: boolean;
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
  ) {
    return false;
  }

  return true;
}

export class CloudflareObjectDeliveryTrackingStore
  implements DeliveryTrackingStore
{
  private readonly keyPrefix: string;
  private readonly fieldCrypto?: DeliveryTrackingFieldCryptoOptions;
  private readonly retention?: DeliveryTrackingRetentionConfig;
  private readonly secureMode: boolean;
  private readonly compatPlainColumns: boolean;

  constructor(
    private readonly storage: CloudflareObjectStorage,
    options: string | CloudflareObjectDeliveryTrackingStoreOptions = {},
  ) {
    if (typeof options === "string") {
      this.keyPrefix = options;
      this.secureMode = false;
      this.compatPlainColumns = true;
      return;
    }

    this.keyPrefix = options.keyPrefix ?? "kmsg/delivery-tracking";
    this.fieldCrypto = options.fieldCrypto;
    this.retention = options.retention;
    this.secureMode =
      typeof options.secureMode === "boolean"
        ? options.secureMode
        : Boolean(options.fieldCrypto);
    this.compatPlainColumns =
      typeof options.compatPlainColumns === "boolean"
        ? options.compatPlainColumns
        : !this.secureMode;
  }

  async init(): Promise<void> {
    // no-op
  }

  async upsert(record: TrackingRecord): Promise<void> {
    const normalized = await this.serializeRecord(record);
    await this.storage.put(
      this.recordKey(record.messageId),
      JSON.stringify(normalized),
    );
  }

  async get(messageId: string): Promise<TrackingRecord | undefined> {
    const raw = await this.storage.get(this.recordKey(messageId));
    if (!raw) return undefined;
    return await this.deserializeRecord(raw);
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
      const record = await this.deserializeRecord(raw);
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
    const normalizedFilter = await this.normalizeFilter(options);

    const keys = await this.storage.list(this.recordPrefix());
    const records: TrackingRecord[] = [];

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = await this.deserializeRecord(raw);
      if (!record) continue;
      if (!matchesFilter(record, normalizedFilter)) continue;
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
    const normalizedFilter = await this.normalizeFilter(filter);
    const keys = await this.storage.list(this.recordPrefix());
    let count = 0;

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = await this.deserializeRecord(raw);
      if (!record) continue;
      if (matchesFilter(record, normalizedFilter)) count += 1;
    }

    return count;
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    const fields = Array.from(groupBy).filter(Boolean);
    if (fields.length === 0) return [];

    const normalizedFilter = await this.normalizeFilter(filter);
    const keys = await this.storage.list(this.recordPrefix());
    const buckets = new Map<
      string,
      { key: Record<string, string>; count: number }
    >();

    for (const key of keys) {
      const raw = await this.storage.get(key);
      if (!raw) continue;
      const record = await this.deserializeRecord(raw);
      if (!record) continue;
      if (!matchesFilter(record, normalizedFilter)) continue;

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
    if (this.patchTouchesCrypto(patch)) {
      const current = await this.get(messageId);
      if (!current) return;
      await this.upsert({
        ...current,
        ...patch,
        messageId: current.messageId,
      });
      return;
    }

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

  private async normalizeFilter<T extends DeliveryTrackingRecordFilter>(
    filter: T,
  ): Promise<T> {
    return (await normalizeTrackingFilterWithHashes(
      filter,
      this.fieldCrypto,
      this.cryptoMode(),
    )) as T;
  }

  private patchTouchesCrypto(patch: Partial<TrackingRecord>): boolean {
    if (!this.secureMode) return false;
    return (
      patch.to !== undefined ||
      "from" in patch ||
      "metadata" in patch ||
      patch.toHash !== undefined ||
      patch.fromHash !== undefined ||
      patch.cryptoKid !== undefined ||
      patch.cryptoVersion !== undefined ||
      patch.cryptoState !== undefined
    );
  }

  private cryptoMode(): TrackingCryptoMode {
    return {
      secureMode: this.secureMode,
      compatPlainColumns: this.compatPlainColumns,
    };
  }

  private async serializeRecord(
    record: TrackingRecord,
  ): Promise<StoredTrackingRecord> {
    const cryptoColumns = await applyTrackingCryptoOnWrite(
      record,
      this.fieldCrypto,
      {
        tableName: "kmsg_delivery_tracking_object",
        store: "object",
      },
      this.cryptoMode(),
    );

    const retentionClass = record.retentionClass ?? "telecomMetadata";
    const retentionDays = await resolveRetentionDays(this.retention, {
      tenantId: this.fieldCrypto?.tenantId,
      record,
      retentionClass,
    });
    const retentionAnchor = new Date(record.requestedAt);
    retentionAnchor.setUTCDate(retentionAnchor.getUTCDate() + retentionDays);

    const base: StoredTrackingRecord = {
      messageId: record.messageId,
      providerId: record.providerId,
      providerMessageId: record.providerMessageId,
      type: record.type,
      requestedAt: record.requestedAt.getTime(),
      scheduledAt: record.scheduledAt?.getTime(),
      status: record.status,
      providerStatusCode: record.providerStatusCode,
      providerStatusMessage: record.providerStatusMessage,
      sentAt: record.sentAt?.getTime(),
      deliveredAt: record.deliveredAt?.getTime(),
      failedAt: record.failedAt?.getTime(),
      statusUpdatedAt: record.statusUpdatedAt.getTime(),
      attemptCount: record.attemptCount,
      lastCheckedAt: record.lastCheckedAt?.getTime(),
      nextCheckAt: record.nextCheckAt.getTime(),
      lastError: record.lastError,
      raw: record.raw,
      retentionClass,
      retentionBucketYm:
        record.retentionBucketYm ?? toRetentionBucketYm(retentionAnchor),
      ...(cryptoColumns.toEnc ? { toEnc: cryptoColumns.toEnc } : {}),
      ...(cryptoColumns.toHash ? { toHash: cryptoColumns.toHash } : {}),
      ...(cryptoColumns.toMasked ? { toMasked: cryptoColumns.toMasked } : {}),
      ...(cryptoColumns.fromEnc ? { fromEnc: cryptoColumns.fromEnc } : {}),
      ...(cryptoColumns.fromHash ? { fromHash: cryptoColumns.fromHash } : {}),
      ...(cryptoColumns.fromMasked
        ? { fromMasked: cryptoColumns.fromMasked }
        : {}),
      ...(cryptoColumns.metadataEnc
        ? { metadataEnc: cryptoColumns.metadataEnc }
        : {}),
      ...(cryptoColumns.metadataHashes
        ? { metadataHashes: cryptoColumns.metadataHashes }
        : {}),
      ...(cryptoColumns.metadata ? { metadata: cryptoColumns.metadata } : {}),
      ...(cryptoColumns.cryptoKid
        ? { cryptoKid: cryptoColumns.cryptoKid }
        : {}),
      ...(cryptoColumns.cryptoVersion
        ? { cryptoVersion: cryptoColumns.cryptoVersion }
        : {}),
      ...(cryptoColumns.cryptoState
        ? { cryptoState: cryptoColumns.cryptoState }
        : {}),
    };

    if (!this.secureMode || this.compatPlainColumns) {
      base.to = record.to;
      base.from = record.from;
    }

    return base;
  }

  private async deserializeRecord(
    raw: string,
  ): Promise<TrackingRecord | undefined> {
    try {
      const parsed = JSON.parse(raw) as StoredTrackingRecord;
      const base: TrackingRecord = {
        messageId: parsed.messageId,
        providerId: parsed.providerId,
        providerMessageId: parsed.providerMessageId,
        type: parsed.type,
        to: parsed.to ?? "",
        from: parsed.from,
        requestedAt: new Date(parsed.requestedAt),
        scheduledAt:
          typeof parsed.scheduledAt === "number"
            ? new Date(parsed.scheduledAt)
            : undefined,
        status: parsed.status,
        providerStatusCode: parsed.providerStatusCode,
        providerStatusMessage: parsed.providerStatusMessage,
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
        attemptCount: parsed.attemptCount,
        lastCheckedAt:
          typeof parsed.lastCheckedAt === "number"
            ? new Date(parsed.lastCheckedAt)
            : undefined,
        nextCheckAt: new Date(parsed.nextCheckAt),
        lastError: parsed.lastError,
        raw: parsed.raw,
        metadata: parsed.metadata,
        retentionClass: parsed.retentionClass,
        retentionBucketYm: parsed.retentionBucketYm,
      };

      return await restoreTrackingCryptoOnRead(
        base,
        {
          toEnc: parsed.toEnc,
          toHash: parsed.toHash,
          toMasked: parsed.toMasked,
          fromEnc: parsed.fromEnc,
          fromHash: parsed.fromHash,
          fromMasked: parsed.fromMasked,
          metadataEnc: parsed.metadataEnc,
          metadataHashes: parsed.metadataHashes,
          metadata: parsed.metadata,
          cryptoKid: parsed.cryptoKid,
          cryptoVersion: parsed.cryptoVersion,
          cryptoState: parsed.cryptoState,
        },
        this.fieldCrypto,
        {
          tableName: "kmsg_delivery_tracking_object",
          store: "object",
        },
        this.cryptoMode(),
      );
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
