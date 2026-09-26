import type {
  DeliveryStatus,
  Provider,
  SendInput,
  SendResult,
} from "@k-msg/core";
import type { HookContext } from "../hooks";
import { logFallbackFailure } from "../shared/log-fallback";
import { DEFAULT_AUTO_LMS_BYTES, estimateSmsBytes } from "../sms-bytes";
import { reconcileDeliveryStatuses } from "./reconciler";
import type {
  DeliveryTrackingCountByField,
  DeliveryTrackingCountByRow,
  DeliveryTrackingListOptions,
  DeliveryTrackingRecordFilter,
  DeliveryTrackingStore,
} from "./store.interface";
import { InMemoryDeliveryTrackingStore } from "./stores/memory.store";
import {
  type ApiFailoverAttemptContext,
  type ApiFailoverClassificationContext,
  DEFAULT_POLLING_CONFIG,
  type DeliveryTrackingApiFailoverConfig,
  type DeliveryTrackingPollingConfig,
  isTerminalDeliveryStatus,
  type TrackingRecord,
} from "./types";

// A deep copy. Raw provider data may not be cloneable; metadata, which stores
// persist as JSON, is then copied through JSON so nothing nested is shared.
function copyRecord(record: TrackingRecord): TrackingRecord {
  try {
    return structuredClone(record);
  } catch {
    const copy = { ...record };
    if (record.metadata) {
      try {
        copy.metadata = JSON.parse(JSON.stringify(record.metadata)) as Record<
          string,
          unknown
        >;
      } catch {
        // Not JSON either (a cycle): the top-level copy is all that is left.
        copy.metadata = { ...record.metadata };
      }
    }
    return copy;
  }
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ApiFailoverOutcome = "sent" | "failed" | "skipped";
type ApiFailoverAttemptStatus = "not_attempted" | "attempting";

interface TrackingFailoverRequestMetadata {
  enabled?: boolean;
  fallbackChannel?: "sms" | "lms";
  fallbackContent?: string;
  fallbackTitle?: string;
}

interface TrackingFailoverApiAttemptMetadata {
  attempted: boolean;
  status: ApiFailoverAttemptStatus;
  attemptedAt?: string;
  outcome?: ApiFailoverOutcome;
  warningCode?: string;
  warningMessage?: string;
  fallbackMessageId?: string;
  fallbackProviderId?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface TrackingFailoverMetadata {
  request: TrackingFailoverRequestMetadata;
  sendWarningCodes: string[];
  apiAttempt: TrackingFailoverApiAttemptMetadata;
}

const API_FAILOVER_ELIGIBLE_WARNING_CODES = new Set([
  "FAILOVER_UNSUPPORTED_PROVIDER",
  "FAILOVER_PARTIAL_PROVIDER",
]);

/** A status a poll stored for a tracked message. */
export interface DeliveryStatusChange {
  /**
   * The record as stored after the poll, or as the poll updated it, without
   * `raw`, if the store cannot return it.
   */
  record: TrackingRecord;
  /** The status the record had before the poll. */
  previousStatus: DeliveryStatus;
}

export interface DeliveryTrackingServiceConfig {
  providers: Provider[];
  store?: DeliveryTrackingStore;
  polling?: Partial<DeliveryTrackingPollingConfig>;
  apiFailover?: DeliveryTrackingApiFailoverConfig;
  /**
   * Called for each record a poll stored with a different status, with the
   * record as stored, after the poll finishes: for example, to notify a
   * webhook when a message is delivered or fails. Calls run one at a time,
   * in the order changes were stored, each with its own copy of the record.
   * It does not stop polling if it throws. Delivery is at least once:
   * services polling the same store can each report the same change, so
   * make it idempotent, for example by message id and status.
   */
  onStatusChange?: (change: DeliveryStatusChange) => void | Promise<void>;
  /**
   * Receives what `onStatusChange` throws. Without it, or when it throws
   * too, the error is written to `console.error`.
   */
  onStatusChangeError?: (
    error: unknown,
    change: DeliveryStatusChange,
  ) => void | Promise<void>;
}

export class DeliveryTrackingService {
  private readonly providers: Provider[];
  private readonly store: DeliveryTrackingStore;
  private readonly polling: DeliveryTrackingPollingConfig;
  private readonly apiFailover?: DeliveryTrackingApiFailoverConfig;
  private readonly onStatusChange?: DeliveryTrackingServiceConfig["onStatusChange"];
  private readonly onStatusChangeError?: DeliveryTrackingServiceConfig["onStatusChangeError"];

  private initPromise?: Promise<void>;
  private timer?: ReturnType<typeof setInterval>;
  private runOnceInFlight?: Promise<void>;
  // Status changes are delivered one at a time, in the order polls stored
  // them, so a slow callback cannot be overtaken by a later change.
  private notificationTail: Promise<void> = Promise.resolve();
  private deliveringNotifications = false;

  constructor(config: DeliveryTrackingServiceConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("DeliveryTrackingService requires a config object");
    }
    if (!Array.isArray(config.providers) || config.providers.length === 0) {
      throw new Error("DeliveryTrackingService requires non-empty `providers`");
    }

    this.providers = config.providers;
    this.store = config.store ?? new InMemoryDeliveryTrackingStore();
    this.apiFailover = config.apiFailover;
    this.onStatusChange = config.onStatusChange;
    this.onStatusChangeError = config.onStatusChangeError;

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

    const recordMetadata: Record<string, unknown> = {};
    if (
      context.options.options?.customFields &&
      typeof context.options.options.customFields === "object"
    ) {
      recordMetadata.customFields = context.options.options.customFields;
    }

    if (context.options.type === "ALIMTALK") {
      const warningCodes = Array.isArray(result.warnings)
        ? result.warnings
            .map((warning) => warning.code)
            .filter((code): code is string => typeof code === "string")
        : [];
      const failoverRequest: TrackingFailoverRequestMetadata = {
        enabled: context.options.failover?.enabled,
        fallbackChannel: context.options.failover?.fallbackChannel,
        fallbackContent: context.options.failover?.fallbackContent,
        fallbackTitle: context.options.failover?.fallbackTitle,
      };

      recordMetadata.failover = {
        request: failoverRequest,
        sendWarningCodes: warningCodes,
        apiAttempt: {
          attempted: false,
          status: "not_attempted",
        },
      };
    }

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
        Object.keys(recordMetadata).length > 0 ? recordMetadata : undefined,
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

  async listRecords(
    options: DeliveryTrackingListOptions,
  ): Promise<TrackingRecord[]> {
    await this.ensureInit();
    if (!this.store.listRecords) return [];
    return await this.store.listRecords(options);
  }

  async countRecords(filter: DeliveryTrackingRecordFilter): Promise<number> {
    await this.ensureInit();
    if (!this.store.countRecords) return 0;
    return await this.store.countRecords(filter);
  }

  async countBy(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]> {
    await this.ensureInit();
    if (!this.store.countBy) return [];
    return await this.store.countBy(filter, groupBy);
  }

  async runOnce(): Promise<void> {
    await this.ensureInit();

    if (this.runOnceInFlight) {
      await this.runOnceInFlight;
      return;
    }

    // Reported once the poll is done, so a callback can call runOnce itself
    // and cannot change a record that API failover still has to read.
    const changes: DeliveryStatusChange[] = [];
    const op = (async () => {
      const now = new Date();
      const due = await this.store.listDue(now, this.polling.batchSize);
      if (due.length === 0) return;
      const dueByMessageId = new Map(
        due.map((record) => [record.messageId, record]),
      );

      const { updates } = await reconcileDeliveryStatuses(
        this.providers,
        due,
        now,
        this.polling,
      );

      for (const update of updates) {
        const patch = { ...update.patch, nextCheckAt: update.nextCheckAt };

        // If the record is terminal, keep it out of the due list.
        if (patch.status && isTerminalDeliveryStatus(patch.status)) {
          patch.nextCheckAt = now;
        }

        await this.store.patch(update.messageId, patch);

        const originalRecord = dueByMessageId.get(update.messageId);
        if (!originalRecord) continue;
        const mergedRecord: TrackingRecord = {
          ...originalRecord,
          ...patch,
          messageId: originalRecord.messageId,
        };

        if (
          this.onStatusChange &&
          mergedRecord.status !== originalRecord.status
        ) {
          changes.push({
            record: mergedRecord,
            previousStatus: originalRecord.status,
          });
        }

        if (this.shouldAttemptApiFailover(mergedRecord)) {
          await this.attemptApiFailover(mergedRecord, now);
        }
      }
    })();

    // Callers that join this run wait for its notifications too.
    const run = this.finishRun(op, changes);
    this.runOnceInFlight = run;
    await run;
  }

  private async finishRun(
    op: Promise<void>,
    changes: DeliveryStatusChange[],
  ): Promise<void> {
    try {
      await op;
    } finally {
      // Only this run can be in flight until it clears the guard. It does so
      // before notifying, so a callback's own runOnce() starts a new poll
      // instead of waiting for itself.
      this.runOnceInFlight = undefined;
      // Changes stored before a failure are still reported, each as this poll
      // left it: reading back later, behind a slow callback, would show a
      // later poll's state instead. A run that ends while a callback is
      // running (such as one that callback started) does not wait for its
      // changes, which queue behind that callback.
      const reentrant = this.deliveringNotifications;
      const snapshots = await Promise.all(
        changes.map((change) => this.readBack(change)),
      );
      const delivered = this.queueNotifications(snapshots);
      if (!reentrant) await delivered;
    }
  }

  private queueNotifications(changes: DeliveryStatusChange[]): Promise<void> {
    if (changes.length === 0) return this.notificationTail;
    // notifyStatusChange never rejects, so neither does this.
    const delivered = this.notificationTail.then(async () => {
      this.deliveringNotifications = true;
      try {
        for (const change of changes) {
          await this.notifyStatusChange(change);
        }
      } finally {
        this.deliveringNotifications = false;
      }
    });
    this.notificationTail = delivered;
    return delivered;
  }

  // The record as stored now, after failover has written its own metadata;
  // a store may also not keep every polled field (raw). If it cannot be read
  // back, the polled record is reported without raw rather than dropped.
  private async readBack(
    change: DeliveryStatusChange,
  ): Promise<DeliveryStatusChange> {
    try {
      const stored = await this.store.get(change.record.messageId);
      // A copy the callback can change without touching the store: a store
      // such as the in-memory one may share nested objects with its rows.
      if (stored) return { ...change, record: copyRecord(stored) };
    } catch (error) {
      logFallbackFailure(
        `[k-msg] could not read message ${change.record.messageId} back for onStatusChange; reporting the polled record`,
        error,
      );
    }
    const record = copyRecord(change.record);
    delete record.raw;
    return { ...change, record };
  }

  private async notifyStatusChange(
    change: DeliveryStatusChange,
  ): Promise<void> {
    if (!this.onStatusChange) return;
    try {
      await this.onStatusChange(change);
    } catch (error) {
      if (this.onStatusChangeError) {
        try {
          await this.onStatusChangeError(error, change);
          return;
        } catch (reportError) {
          logFallbackFailure(
            "[k-msg] onStatusChangeError threw while reporting an onStatusChange error",
            reportError,
          );
        }
      }
      // Last resort, so a broken callback does not fail silently.
      logFallbackFailure(
        `[k-msg] onStatusChange threw for message ${change.record.messageId}; the stored status is unaffected`,
        error,
      );
    }
  }

  private async ensureInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.store.init();
    }
    await this.initPromise;
  }

  private shouldAttemptApiFailover(record: TrackingRecord): boolean {
    if (!this.apiFailover || this.apiFailover.enabled === false) return false;
    if (record.type !== "ALIMTALK") return false;
    if (record.status !== "FAILED") return false;

    const failover = this.readFailoverMetadata(record.metadata);
    if (failover.request.enabled !== true) return false;
    if (failover.apiAttempt.attempted) return false;

    const hasEligibleWarning = failover.sendWarningCodes.some((code) =>
      API_FAILOVER_ELIGIBLE_WARNING_CODES.has(code),
    );
    if (!hasEligibleWarning) return false;

    return this.isNonKakaoUserFailure(record);
  }

  private isNonKakaoUserFailure(record: TrackingRecord): boolean {
    const statusCode = record.providerStatusCode;
    const statusMessage = record.providerStatusMessage;

    const classificationContext: ApiFailoverClassificationContext = {
      record,
      statusCode,
      statusMessage,
      raw: record.raw,
    };

    if (typeof this.apiFailover?.classifyNonKakaoUser === "function") {
      try {
        return Boolean(
          this.apiFailover.classifyNonKakaoUser(classificationContext),
        );
      } catch {
        return false;
      }
    }

    const providerRules =
      this.apiFailover?.rulesByProviderId?.[record.providerId];
    if (
      providerRules &&
      this.matchesRule(statusCode, statusMessage, providerRules)
    ) {
      return true;
    }

    if (record.providerId === "solapi") {
      if (statusCode === "3104" || statusCode === "3107") return true;
      if (
        typeof statusMessage === "string" &&
        statusMessage.includes("미사용자")
      ) {
        return true;
      }
      return false;
    }

    if (record.providerId === "iwinv") {
      const mergedText = `${statusCode ?? ""} ${statusMessage ?? ""}`;
      return mergedText.includes("카카오") && mergedText.includes("미사용");
    }

    return false;
  }

  private matchesRule(
    statusCode: string | undefined,
    statusMessage: string | undefined,
    rule: { statusCodes?: string[]; messageIncludes?: string[] },
  ): boolean {
    if (
      Array.isArray(rule.statusCodes) &&
      statusCode &&
      rule.statusCodes.includes(statusCode)
    ) {
      return true;
    }

    if (
      Array.isArray(rule.messageIncludes) &&
      typeof statusMessage === "string" &&
      rule.messageIncludes.some(
        (token) => typeof token === "string" && statusMessage.includes(token),
      )
    ) {
      return true;
    }

    return false;
  }

  private async attemptApiFailover(
    record: TrackingRecord,
    now: Date,
  ): Promise<void> {
    const apiFailover = this.apiFailover;
    if (!apiFailover) return;

    const failover = this.readFailoverMetadata(record.metadata);
    const attemptedAt = now.toISOString();
    const withPreAttempt = this.withApiAttemptMetadata(record.metadata, {
      attempted: true,
      status: "attempting",
      attemptedAt,
    });

    await this.store.patch(record.messageId, {
      metadata: withPreAttempt,
    });

    if (typeof apiFailover.sender !== "function") {
      await this.store.patch(record.messageId, {
        metadata: this.withApiAttemptMetadata(withPreAttempt, {
          outcome: "skipped",
          warningCode: "API_FAILOVER_SENDER_MISSING",
          warningMessage: "apiFailover.sender is not configured",
        }),
      });
      return;
    }

    const fallbackContent = failover.request.fallbackContent?.trim() ?? "";
    if (fallbackContent.length === 0) {
      await this.store.patch(record.messageId, {
        metadata: this.withApiAttemptMetadata(withPreAttempt, {
          outcome: "skipped",
          warningCode: "FALLBACK_CONTENT_MISSING",
          warningMessage:
            "failover.fallbackContent is required for API-level fallback",
        }),
      });
      return;
    }

    // KMsg records the channel it chose; size text sent some other way.
    const fallbackChannel =
      failover.request.fallbackChannel ??
      (estimateSmsBytes(fallbackContent) > DEFAULT_AUTO_LMS_BYTES
        ? "lms"
        : "sms");
    const fallbackType = fallbackChannel === "lms" ? "LMS" : "SMS";
    const fallbackTitle =
      typeof failover.request.fallbackTitle === "string" &&
      failover.request.fallbackTitle.trim().length > 0
        ? failover.request.fallbackTitle.trim()
        : undefined;
    const fallbackMessageId = `${record.messageId}:api-fallback`;

    const sendInput: SendInput = {
      type: fallbackType,
      to: record.to,
      ...(record.from ? { from: record.from } : {}),
      text: fallbackContent,
      ...(fallbackType === "LMS" && fallbackTitle
        ? { subject: fallbackTitle }
        : {}),
      messageId: fallbackMessageId,
    };

    const attemptContext: ApiFailoverAttemptContext = {
      originalMessageId: record.messageId,
      originalProviderId: record.providerId,
      originalProviderMessageId: record.providerMessageId,
      fallbackMessageId,
      fallbackType,
      record,
    };

    try {
      const sendResult = await apiFailover.sender(sendInput, attemptContext);
      if (sendResult.isSuccess) {
        await this.store.patch(record.messageId, {
          metadata: this.withApiAttemptMetadata(withPreAttempt, {
            outcome: "sent",
            fallbackMessageId: sendResult.value.messageId,
            fallbackProviderId: sendResult.value.providerId,
          }),
        });
        return;
      }

      await this.store.patch(record.messageId, {
        metadata: this.withApiAttemptMetadata(withPreAttempt, {
          outcome: "failed",
          errorCode: sendResult.error.code,
          errorMessage: sendResult.error.message,
        }),
      });
    } catch (error) {
      await this.store.patch(record.messageId, {
        metadata: this.withApiAttemptMetadata(withPreAttempt, {
          outcome: "failed",
          errorCode: "API_FAILOVER_SEND_EXCEPTION",
          errorMessage: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  }

  private readFailoverMetadata(
    metadata: Record<string, unknown> | undefined,
  ): TrackingFailoverMetadata {
    const root = isObjectRecord(metadata) ? metadata : {};
    const failover = isObjectRecord(root.failover) ? root.failover : {};
    const request = isObjectRecord(failover.request) ? failover.request : {};

    const sendWarningCodes = Array.isArray(failover.sendWarningCodes)
      ? failover.sendWarningCodes.filter(
          (code): code is string => typeof code === "string",
        )
      : [];

    const apiAttempt = isObjectRecord(failover.apiAttempt)
      ? failover.apiAttempt
      : {};

    return {
      request: {
        enabled:
          typeof request.enabled === "boolean" ? request.enabled : undefined,
        fallbackChannel:
          request.fallbackChannel === "lms" || request.fallbackChannel === "sms"
            ? request.fallbackChannel
            : undefined,
        fallbackContent:
          typeof request.fallbackContent === "string"
            ? request.fallbackContent
            : undefined,
        fallbackTitle:
          typeof request.fallbackTitle === "string"
            ? request.fallbackTitle
            : undefined,
      },
      sendWarningCodes,
      apiAttempt: {
        attempted: apiAttempt.attempted === true,
        status:
          apiAttempt.status === "attempting" ? "attempting" : "not_attempted",
        attemptedAt:
          typeof apiAttempt.attemptedAt === "string"
            ? apiAttempt.attemptedAt
            : undefined,
        outcome:
          apiAttempt.outcome === "sent" ||
          apiAttempt.outcome === "failed" ||
          apiAttempt.outcome === "skipped"
            ? apiAttempt.outcome
            : undefined,
        warningCode:
          typeof apiAttempt.warningCode === "string"
            ? apiAttempt.warningCode
            : undefined,
        warningMessage:
          typeof apiAttempt.warningMessage === "string"
            ? apiAttempt.warningMessage
            : undefined,
        fallbackMessageId:
          typeof apiAttempt.fallbackMessageId === "string"
            ? apiAttempt.fallbackMessageId
            : undefined,
        fallbackProviderId:
          typeof apiAttempt.fallbackProviderId === "string"
            ? apiAttempt.fallbackProviderId
            : undefined,
        errorCode:
          typeof apiAttempt.errorCode === "string"
            ? apiAttempt.errorCode
            : undefined,
        errorMessage:
          typeof apiAttempt.errorMessage === "string"
            ? apiAttempt.errorMessage
            : undefined,
      },
    };
  }

  private withApiAttemptMetadata(
    metadata: Record<string, unknown> | undefined,
    patch: Partial<TrackingFailoverApiAttemptMetadata>,
  ): Record<string, unknown> {
    const root = isObjectRecord(metadata) ? { ...metadata } : {};
    const failover = isObjectRecord(root.failover) ? { ...root.failover } : {};
    const current = this.readFailoverMetadata(root).apiAttempt;

    failover.apiAttempt = {
      ...current,
      ...patch,
    };
    root.failover = failover;
    return root;
  }
}
