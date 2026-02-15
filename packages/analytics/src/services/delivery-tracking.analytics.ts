import type { DeliveryStatus, MessageType } from "@k-msg/core";
import type {
  DeliveryTrackingCountByRow,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "@k-msg/messaging";

const ALL_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  "PENDING",
  "SENT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
  "UNKNOWN",
];

function emptyStatusCounts(): Record<DeliveryStatus, number> {
  return {
    PENDING: 0,
    SENT: 0,
    DELIVERED: 0,
    FAILED: 0,
    CANCELLED: 0,
    UNKNOWN: 0,
  };
}

function applyCountByRows(
  base: Record<DeliveryStatus, number>,
  rows: DeliveryTrackingCountByRow[],
): Record<DeliveryStatus, number> {
  const out: Record<DeliveryStatus, number> = { ...base };
  for (const row of rows) {
    const status = row.key.status as DeliveryStatus | undefined;
    if (!status) continue;
    if (!ALL_DELIVERY_STATUSES.includes(status)) continue;
    out[status] = Number(row.count) || 0;
  }
  return out;
}

export interface DeliveryTrackingAnalyticsQuery {
  requestedAt: { start: Date; end: Date };
  providerId?: string | string[];
  type?: MessageType | MessageType[];
}

export interface DeliveryTrackingAnalyticsBreakdown {
  total: number;
  byStatus: Record<DeliveryStatus, number>;
  rates: {
    deliveredOfTotalPct: number;
    failedOfTotalPct: number;
    deliveredOfFinalizedPct: number;
  };
}

export interface DeliveryTrackingAnalyticsSummary
  extends DeliveryTrackingAnalyticsBreakdown {
  byProviderId?: Record<string, DeliveryTrackingAnalyticsBreakdown>;
  byType?: Record<string, DeliveryTrackingAnalyticsBreakdown>;
}

export class DeliveryTrackingAnalyticsService {
  private readonly store: DeliveryTrackingStore;
  private initPromise?: Promise<void>;

  constructor(config: { store: DeliveryTrackingStore }) {
    this.store = config.store;
  }

  async init(): Promise<void> {
    await this.ensureInit();
  }

  async getSummary(
    query: DeliveryTrackingAnalyticsQuery,
    options: { includeByProviderId?: boolean; includeByType?: boolean } = {},
  ): Promise<DeliveryTrackingAnalyticsSummary> {
    await this.ensureInit();

    if (!(query.requestedAt?.start instanceof Date)) {
      throw new Error("query.requestedAt.start must be a Date");
    }
    if (!(query.requestedAt?.end instanceof Date)) {
      throw new Error("query.requestedAt.end must be a Date");
    }
    if (query.requestedAt.start.getTime() > query.requestedAt.end.getTime()) {
      throw new Error(
        "query.requestedAt.start must be <= query.requestedAt.end",
      );
    }

    if (typeof this.store.countRecords !== "function") {
      throw new Error(
        "DeliveryTrackingStore does not support countRecords(). Use a built-in store (InMemory/SQLite/Bun.SQL) or implement countRecords().",
      );
    }
    if (typeof this.store.countBy !== "function") {
      throw new Error(
        "DeliveryTrackingStore does not support countBy(). Use a built-in store (InMemory/SQLite/Bun.SQL) or implement countBy().",
      );
    }

    const filter: DeliveryTrackingRecordFilter = {
      requestedAtFrom: query.requestedAt.start,
      requestedAtTo: query.requestedAt.end,
      ...(query.providerId ? { providerId: query.providerId } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const total = await this.store.countRecords(filter);
    const byStatusRows = await this.store.countBy(filter, ["status"]);
    const byStatus = applyCountByRows(emptyStatusCounts(), byStatusRows);

    const delivered = byStatus.DELIVERED;
    const failed = byStatus.FAILED;
    const finalized = delivered + failed;

    const base: DeliveryTrackingAnalyticsSummary = {
      total,
      byStatus,
      rates: {
        deliveredOfTotalPct: total > 0 ? (delivered / total) * 100 : 0,
        failedOfTotalPct: total > 0 ? (failed / total) * 100 : 0,
        deliveredOfFinalizedPct:
          finalized > 0 ? (delivered / finalized) * 100 : 0,
      },
    };

    if (options.includeByProviderId) {
      const rows = await this.store.countBy(filter, ["providerId", "status"]);
      base.byProviderId = this.buildBreakdownMap(rows, "providerId");
    }

    if (options.includeByType) {
      const rows = await this.store.countBy(filter, ["type", "status"]);
      base.byType = this.buildBreakdownMap(rows, "type");
    }

    return base;
  }

  private buildBreakdownMap(
    rows: DeliveryTrackingCountByRow[],
    groupField: "providerId" | "type",
  ): Record<string, DeliveryTrackingAnalyticsBreakdown> {
    const byKey = new Map<string, DeliveryTrackingCountByRow[]>();
    for (const row of rows) {
      const k = row.key[groupField];
      if (!k) continue;
      const existing = byKey.get(k);
      if (existing) existing.push(row);
      else byKey.set(k, [row]);
    }

    const out: Record<string, DeliveryTrackingAnalyticsBreakdown> = {};
    for (const [k, groupRows] of byKey.entries()) {
      const normalized: DeliveryTrackingCountByRow[] = groupRows.map((r) => ({
        key: { status: r.key.status },
        count: r.count,
      }));

      const byStatus = applyCountByRows(emptyStatusCounts(), normalized);
      const total = Object.values(byStatus).reduce((sum, v) => sum + v, 0);
      const delivered = byStatus.DELIVERED;
      const failed = byStatus.FAILED;
      const finalized = delivered + failed;

      out[k] = {
        total,
        byStatus,
        rates: {
          deliveredOfTotalPct: total > 0 ? (delivered / total) * 100 : 0,
          failedOfTotalPct: total > 0 ? (failed / total) * 100 : 0,
          deliveredOfFinalizedPct:
            finalized > 0 ? (delivered / finalized) * 100 : 0,
        },
      };
    }

    return out;
  }

  private async ensureInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.store.init();
    }
    await this.initPromise;
  }
}
