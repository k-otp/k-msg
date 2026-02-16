import type {
  DeliveryStatus,
  Provider,
  SendInput,
  SendResult,
} from "@k-msg/core";
import type { HookContext } from "../hooks";
import { reconcileDeliveryStatuses } from "./reconciler";
import type { DeliveryTrackingStore } from "./store.interface";
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

export interface DeliveryTrackingServiceConfig {
  providers: Provider[];
  store?: DeliveryTrackingStore;
  polling?: Partial<DeliveryTrackingPollingConfig>;
  apiFailover?: DeliveryTrackingApiFailoverConfig;
}

export class DeliveryTrackingService {
  private readonly providers: Provider[];
  private readonly store: DeliveryTrackingStore;
  private readonly polling: DeliveryTrackingPollingConfig;
  private readonly apiFailover?: DeliveryTrackingApiFailoverConfig;

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
    this.store = config.store ?? new InMemoryDeliveryTrackingStore();
    this.apiFailover = config.apiFailover;

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

        if (this.shouldAttemptApiFailover(mergedRecord)) {
          await this.attemptApiFailover(mergedRecord, now);
        }
      }
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

    const fallbackType =
      failover.request.fallbackChannel === "lms" ? "LMS" : "SMS";
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
