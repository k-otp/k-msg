import {
  ErrorUtils,
  type DeliveryStatus,
  type DeliveryStatusQuery,
  type Provider,
} from "@k-msg/core";
import { DEFAULT_POLLING_CONFIG, isTerminalDeliveryStatus, type TrackingReconcileResult, type TrackingRecord, type TrackingUpdate } from "./types";

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function computeNextCheckAt(
  now: Date,
  attemptCountAfter: number,
  backoffMs: number[],
): Date {
  const safeAttempt = Number.isFinite(attemptCountAfter)
    ? Math.max(0, Math.floor(attemptCountAfter))
    : 0;
  const idx = Math.min(Math.max(0, safeAttempt - 1), backoffMs.length - 1);
  const delay =
    backoffMs.length > 0 && typeof backoffMs[idx] === "number"
      ? Math.max(0, Math.floor(backoffMs[idx]!))
      : 60_000;
  return new Date(now.getTime() + delay);
}

export async function reconcileDeliveryStatuses(
  providers: Provider[],
  records: TrackingRecord[],
  now: Date,
  polling = DEFAULT_POLLING_CONFIG,
): Promise<TrackingReconcileResult> {
  const updates: TrackingUpdate[] = [];
  const errors: TrackingReconcileResult["errors"] = [];

  const providersById = new Map<string, Provider>();
  for (const provider of providers) {
    if (!provider || typeof provider.id !== "string") continue;
    if (!providersById.has(provider.id)) providersById.set(provider.id, provider);
  }

  const concurrency =
    typeof polling.concurrency === "number" && polling.concurrency > 0
      ? Math.floor(polling.concurrency)
      : DEFAULT_POLLING_CONFIG.concurrency;

  let idx = 0;
  const processOne = async (record: TrackingRecord) => {
    const patchBase: Partial<TrackingRecord> = {
      lastCheckedAt: now,
      attemptCount: record.attemptCount + 1,
    };

    if (!record.providerMessageId || record.providerMessageId.trim().length === 0) {
      const terminalPatch: Partial<TrackingRecord> = {
        ...patchBase,
        status: "UNKNOWN",
        statusUpdatedAt: now,
        nextCheckAt: now,
        lastError: { code: "MISSING_PROVIDER_MESSAGE_ID", message: "providerMessageId missing" },
      };
      updates.push({
        messageId: record.messageId,
        patch: terminalPatch,
        nextCheckAt: now,
        terminal: true,
      });
      return;
    }

    const maxDurationMs = polling.maxTrackingDurationMs;
    if (
      typeof maxDurationMs === "number" &&
      maxDurationMs > 0 &&
      now.getTime() - record.requestedAt.getTime() > maxDurationMs &&
      !isTerminalDeliveryStatus(record.status)
    ) {
      const terminalPatch: Partial<TrackingRecord> = {
        ...patchBase,
        status: "UNKNOWN",
        statusUpdatedAt: now,
        nextCheckAt: now,
        lastError: { code: "TRACKING_TIMEOUT", message: "max tracking duration exceeded" },
      };
      updates.push({
        messageId: record.messageId,
        patch: terminalPatch,
        nextCheckAt: now,
        terminal: true,
      });
      return;
    }

    if (isValidDate(record.scheduledAt)) {
      const graceUntil = new Date(record.scheduledAt.getTime() + polling.scheduledGraceMs);
      if (now.getTime() < graceUntil.getTime()) {
        updates.push({
          messageId: record.messageId,
          patch: { ...patchBase, nextCheckAt: graceUntil },
          nextCheckAt: graceUntil,
          terminal: false,
        });
        return;
      }
    }

    const provider = providersById.get(record.providerId);
    if (!provider) {
      const terminalPatch: Partial<TrackingRecord> = {
        ...patchBase,
        status: "UNKNOWN",
        statusUpdatedAt: now,
        nextCheckAt: now,
        lastError: { code: "PROVIDER_NOT_FOUND", message: `Provider not found: ${record.providerId}` },
      };
      updates.push({
        messageId: record.messageId,
        patch: terminalPatch,
        nextCheckAt: now,
        terminal: true,
      });
      return;
    }

    if (typeof provider.getDeliveryStatus !== "function") {
      if (polling.unsupportedProviderStrategy === "unknown") {
        const terminalPatch: Partial<TrackingRecord> = {
          ...patchBase,
          status: "UNKNOWN",
          statusUpdatedAt: now,
          nextCheckAt: now,
          lastError: { code: "UNSUPPORTED_PROVIDER", message: "Provider has no getDeliveryStatus()" },
        };
        updates.push({
          messageId: record.messageId,
          patch: terminalPatch,
          nextCheckAt: now,
          terminal: true,
        });
        return;
      }

      const nextCheckAt = computeNextCheckAt(
        now,
        patchBase.attemptCount ?? record.attemptCount + 1,
        polling.backoffMs,
      );
      updates.push({
        messageId: record.messageId,
        patch: {
          ...patchBase,
          nextCheckAt,
          lastError: { code: "UNSUPPORTED_PROVIDER", message: "Provider has no getDeliveryStatus()" },
        },
        nextCheckAt,
        terminal: false,
      });
      return;
    }

    const query: DeliveryStatusQuery = {
      providerMessageId: record.providerMessageId,
      type: record.type,
      to: record.to,
      requestedAt: record.requestedAt,
      ...(isValidDate(record.scheduledAt) ? { scheduledAt: record.scheduledAt } : {}),
    };

    const result = await provider.getDeliveryStatus(query);
    if (result.isFailure) {
      errors.push({ messageId: record.messageId, error: result.error });

      const nonRetryable = !ErrorUtils.isRetryable(result.error);
      if (nonRetryable) {
        const terminalPatch: Partial<TrackingRecord> = {
          ...patchBase,
          status: "UNKNOWN",
          statusUpdatedAt: now,
          nextCheckAt: now,
          lastError: { code: result.error.code, message: result.error.message },
        };
        updates.push({
          messageId: record.messageId,
          patch: terminalPatch,
          nextCheckAt: now,
          terminal: true,
        });
        return;
      }

      const nextCheckAt = computeNextCheckAt(
        now,
        patchBase.attemptCount ?? record.attemptCount + 1,
        polling.backoffMs,
      );
      updates.push({
        messageId: record.messageId,
        patch: {
          ...patchBase,
          nextCheckAt,
          lastError: { code: result.error.code, message: result.error.message },
        },
        nextCheckAt,
        terminal: false,
      });
      return;
    }

    const value = result.value;
    if (value === null) {
      const nextCheckAt = computeNextCheckAt(
        now,
        patchBase.attemptCount ?? record.attemptCount + 1,
        polling.backoffMs,
      );
      updates.push({
        messageId: record.messageId,
        patch: { ...patchBase, nextCheckAt, lastError: undefined },
        nextCheckAt,
        terminal: false,
      });
      return;
    }

    const status: DeliveryStatus = value.status;
    const terminal = isTerminalDeliveryStatus(status);
    const nextCheckAt = terminal
      ? now
      : computeNextCheckAt(
          now,
          patchBase.attemptCount ?? record.attemptCount + 1,
          polling.backoffMs,
        );

    updates.push({
      messageId: record.messageId,
      patch: {
        ...patchBase,
        status,
        statusUpdatedAt: now,
        nextCheckAt,
        lastError: undefined,
        raw: value.raw,
      },
      nextCheckAt,
      terminal,
      raw: value.raw,
    });
  };

  const worker = async () => {
    while (true) {
      const current = idx++;
      if (current >= records.length) return;
      await processOne(records[current]!);
    }
  };

  const workers = new Array(Math.min(concurrency, records.length))
    .fill(null)
    .map(() => worker());
  await Promise.all(workers);

  return { updates, errors };
}
