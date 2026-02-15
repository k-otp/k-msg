import type { DeliveryStatus, Provider, SendResult } from "@k-msg/core";
import type { HookContext } from "../hooks";
import { reconcileDeliveryStatuses } from "./reconciler";
import type { DeliveryTrackingStore } from "./store.interface";
import { SqliteDeliveryTrackingStore } from "./stores/sqlite.store";
import {
  DEFAULT_POLLING_CONFIG,
  type DeliveryTrackingPollingConfig,
  isTerminalDeliveryStatus,
  type TrackingRecord,
} from "./types";

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export interface DeliveryTrackingServiceConfig {
  providers: Provider[];
  store?: DeliveryTrackingStore;
  polling?: Partial<DeliveryTrackingPollingConfig>;
}

export class DeliveryTrackingService {
  private readonly providers: Provider[];
  private readonly store: DeliveryTrackingStore;
  private readonly polling: DeliveryTrackingPollingConfig;

  private initPromise?: Promise<void>;
  private timer?: NodeJS.Timeout;
  private runOnceInFlight?: Promise<void>;

  constructor(config: DeliveryTrackingServiceConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("DeliveryTrackingService requires a config object");
    }
    if (!Array.isArray(config.providers) || config.providers.length === 0) {
      throw new Error("DeliveryTrackingService requires non-empty `providers`");
    }

    this.providers = config.providers;
    this.store =
      config.store ??
      new SqliteDeliveryTrackingStore({ dbPath: "./kmsg.sqlite" });

    const polling = config.polling ?? {};
    this.polling = {
      ...DEFAULT_POLLING_CONFIG,
      ...polling,
      backoffMs: Array.isArray(polling.backoffMs)
        ? polling.backoffMs
        : DEFAULT_POLLING_CONFIG.backoffMs,
      unsupportedProviderStrategy:
        polling.unsupportedProviderStrategy ??
        DEFAULT_POLLING_CONFIG.unsupportedProviderStrategy,
    };
  }

  async init(): Promise<void> {
    await this.ensureInit();
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.runOnce().catch(() => {
        // Best-effort polling. Delivery tracking must not crash the host process.
      });
    }, this.polling.intervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  async close(): Promise<void> {
    this.stop();
    await this.store.close?.();
  }

  async recordSend(context: HookContext, result: SendResult): Promise<void> {
    await this.ensureInit();

    const now = new Date();
    const requestedAt = new Date(context.timestamp);
    const scheduledAt = context.options.options?.scheduledAt;
    const scheduledAtValid = isValidDate(scheduledAt);

    const initialStatus: DeliveryStatus = scheduledAtValid ? "PENDING" : "SENT";
    const nextCheckAt = scheduledAtValid
      ? new Date(scheduledAt.getTime() + this.polling.scheduledGraceMs)
      : new Date(requestedAt.getTime() + this.polling.initialDelayMs);

    const providerMessageIdRaw =
      typeof result.providerMessageId === "string"
        ? result.providerMessageId
        : "";
    const providerMessageId = providerMessageIdRaw.trim();

    const record: TrackingRecord = {
      messageId: context.messageId,
      providerId: result.providerId,
      providerMessageId,
      type: context.options.type,
      to: context.options.to,
      from: context.options.from,
      requestedAt,
      ...(scheduledAtValid ? { scheduledAt } : {}),
      status: initialStatus,
      statusUpdatedAt: now,
      attemptCount: 0,
      nextCheckAt,
      metadata:
        context.options.options?.customFields &&
        typeof context.options.options.customFields === "object"
          ? { customFields: context.options.options.customFields }
          : undefined,
    };

    if (!providerMessageId) {
      record.status = "UNKNOWN";
      record.statusUpdatedAt = now;
      record.nextCheckAt = now;
      record.lastError = {
        code: "MISSING_PROVIDER_MESSAGE_ID",
        message: "providerMessageId missing",
      };
    }

    await this.store.upsert(record);
  }

  async getRecord(messageId: string): Promise<TrackingRecord | undefined> {
    await this.ensureInit();
    return await this.store.get(messageId);
  }

  async runOnce(): Promise<void> {
    await this.ensureInit();

    if (this.runOnceInFlight) {
      await this.runOnceInFlight;
      return;
    }

    const op = (async () => {
      const now = new Date();
      const due = await this.store.listDue(now, this.polling.batchSize);
      if (due.length === 0) return;

      const { updates } = await reconcileDeliveryStatuses(
        this.providers,
        due,
        now,
        this.polling,
      );

      await Promise.all(
        updates.map(async (u) => {
          const patch = { ...u.patch, nextCheckAt: u.nextCheckAt };

          // If the record is terminal, keep it out of the due list.
          if (patch.status && isTerminalDeliveryStatus(patch.status)) {
            patch.nextCheckAt = now;
          }

          await this.store.patch(u.messageId, patch);
        }),
      );
    })();

    this.runOnceInFlight = op;
    try {
      await op;
    } finally {
      if (this.runOnceInFlight === op) this.runOnceInFlight = undefined;
    }
  }

  private async ensureInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.store.init();
    }
    await this.initPromise;
  }
}
