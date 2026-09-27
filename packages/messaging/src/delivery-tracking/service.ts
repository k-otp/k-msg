import type {
  DeliveryStatus,
  Provider,
  ProviderRequestContext,
  SendInput,
  SendResult,
} from "@k-msg/core";
import type { HookContext } from "../hooks";
import { logBackgroundFailure } from "../shared/log-background-failure";
import { logFallbackFailure } from "../shared/log-fallback";
import { DEFAULT_AUTO_LMS_BYTES, estimateSmsBytes } from "../sms-bytes";
import { computeNextCheckAt, reconcileDeliveryStatuses } from "./reconciler";
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

// A deep copy, which never throws. Only raw and metadata hold free-form data,
// and raw provider data may hold values structuredClone rejects, such as
// functions. Both are then copied through JSON, as stores persist them,
// which drops such values but shares nothing. Raw that JSON cannot copy
// either (a cycle) is left out; such metadata is copied one level deep, as
// are the other fields if a store returned something uncloneable in them.
function copyRecord(record: TrackingRecord): TrackingRecord {
  try {
    return structuredClone(record);
  } catch {
    const { raw, metadata, ...fields } = record;
    let copy: TrackingRecord;
    try {
      copy = structuredClone(fields);
    } catch {
      copy = { ...fields };
    }
    if (metadata !== undefined) {
      copy.metadata = jsonCopy(metadata) ?? { ...metadata };
    }
    const rawCopy = raw === undefined ? undefined : jsonCopy(raw);
    if (rawCopy !== undefined) copy.raw = rawCopy;
    return copy;
  }
}

function jsonCopy<T>(value: T): T | undefined {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

interface CallbackContext {
  run<R>(store: true, callback: () => R): R;
  getStore(): true | undefined;
}

// Tells a runOnce() made from a status change callback, of any service,
// apart from any other call made while a callback runs. AsyncLocalStorage
// is reached through process.getBuiltinModule, which Node, Bun, and
// Cloudflare Workers provide, so nothing is imported in a runtime that
// lacks it.
function createCallbackContext(): CallbackContext | undefined {
  try {
    const runtime = globalThis as {
      process?: { getBuiltinModule?: (id: string) => unknown };
    };
    const hooks = runtime.process?.getBuiltinModule?.("node:async_hooks") as
      | { AsyncLocalStorage?: new () => CallbackContext }
      | undefined;
    return hooks?.AsyncLocalStorage ? new hooks.AsyncLocalStorage() : undefined;
  } catch {
    return undefined;
  }
}

const callbackContext = createCallbackContext();

/** One poll: its changes are queued, then delivered. */
interface PollRun {
  /** Settles when the poll is done and its changes are queued. */
  polled: Promise<void>;
  /** Settles when its changes have been delivered, with the poll's outcome. */
  delivered: Promise<void>;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A signal that aborts when any of the given ones does. unlink() removes its
// listeners, so a long-lived signal does not collect one per poll.
function linkSignals(...signals: Array<AbortSignal | undefined>): {
  signal: AbortSignal;
  unlink(): void;
} {
  const controller = new AbortController();
  const unlinks: Array<() => void> = [];
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    const onAbort = () => controller.abort(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    unlinks.push(() => signal.removeEventListener("abort", onAbort));
  }
  return {
    signal: controller.signal,
    unlink: () => {
      for (const unlink of unlinks) unlink();
    },
  };
}

// Waits for a poll, or only until `signal` aborts.
function waitForPoll(
  poll: Promise<void>,
  signal: AbortSignal | undefined,
): Promise<void> {
  if (!signal) return poll;
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => resolve();
    signal.addEventListener("abort", onAbort, { once: true });
    void poll.then(
      () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
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
   * in the order changes were stored, each with its own copy of the record;
   * `runOnce()` describes the one exception, in runtimes without
   * AsyncLocalStorage. It does not stop polling if it throws.
   *
   * Delivery is best effort: a change whose callback throws is not retried,
   * and one stored just before the process stops is not reported, so
   * reconcile with the stored records when none may be missed. Services
   * polling the same store can also each report the same change, so make
   * it idempotent, for example by message id and status.
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
  private runOnceInFlight?: PollRun;
  // Status changes are delivered one at a time, in the order polls stored
  // them, so a slow callback cannot be overtaken by a later change.
  private notificationTail: Promise<void> = Promise.resolve();
  // Batches of changes being delivered: queued ones, and in a runtime
  // without AsyncLocalStorage, ones delivered at once.
  private activeDeliveries = 0;
  // Aborted by close(): it stops a poll in progress and every later one.
  private readonly closing = new AbortController();

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
      leaseMs: polling.leaseMs ?? DEFAULT_POLLING_CONFIG.leaseMs,
    };
  }

  async init(): Promise<void> {
    await this.ensureInit();
  }

  start(): void {
    if (this.timer || this.closing.signal.aborted) return;
    this.timer = setInterval(() => {
      // Delivery tracking must not crash the host process; the next tick
      // polls again.
      void this.runOnce().catch((error: unknown) => {
        logBackgroundFailure("Delivery tracking poll failed", error);
      });
    }, this.polling.intervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  /**
   * Stops polling and closes the store. A poll in progress stops as if its
   * signal had aborted, and close() waits for it to store the statuses it
   * has before closing the store; status changes still being delivered to
   * `onStatusChange` are not waited for. The service does not poll again.
   */
  async close(): Promise<void> {
    this.stop();
    this.closing.abort();
    // A failed poll is reported to whoever started it: the runOnce() caller,
    // or the timer, which logs it.
    await this.runOnceInFlight?.polled.catch(() => undefined);
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

  /**
   * Polls the records that are due once, or joins a poll already running.
   * It resolves once the poll's status changes have been delivered to
   * `onStatusChange`. A callback may call it too, as may a callback of
   * another service: while this service is delivering, such a call resolves
   * once the poll's changes are queued, since they may be delivered after
   * the callback. Work a callback starts without awaiting it counts as the
   * callback's.
   *
   * A runtime without AsyncLocalStorage, such as Workers without
   * nodejs_compat on older compatibility dates, cannot tell those calls
   * from others. There, a poll that ends while callbacks run delivers its
   * changes at once, beside them rather than after them, and every call
   * waits until its changes are delivered.
   *
   * `request` goes to each status query of the poll this call starts, as
   * `KMsg.send()` passes it to the provider: a `signal` to cancel it and a
   * `fetch` to make it with. The signal also bounds the poll: once it
   * aborts, no more queries start, those still running are cancelled, and
   * the poll stores the statuses it has and ends. The records it did not
   * finish stay due. A call that joins a poll already running stops waiting
   * for it when its own signal aborts. After `close()`, it does nothing.
   */
  async runOnce(request?: ProviderRequestContext): Promise<void> {
    // Checked before any await, while the caller's context is current.
    const fromCallback = this.calledFromCallback();
    if (this.closing.signal.aborted) return;
    await this.ensureInit();
    const joined = this.runOnceInFlight;
    const run = joined ?? this.startRun(request);
    const done = fromCallback ? run.polled : run.delivered;
    await (joined ? waitForPoll(done, request?.signal) : done);
  }

  // A callback that waited for notifications queued behind itself would
  // never finish. So would callbacks of two services that each wait for
  // the other's, nested or running side by side, so a call from any
  // service's callback does not wait while this service is delivering.
  // Without AsyncLocalStorage every caller waits: see startRun().
  private calledFromCallback(): boolean {
    if (!callbackContext || this.activeDeliveries === 0) return false;
    return callbackContext.getStore() === true;
  }

  private startRun(request?: ProviderRequestContext): PollRun {
    // Reported once the poll is done, so a callback can call runOnce itself
    // and cannot change a record that API failover still has to read.
    const changes: DeliveryStatusChange[] = [];
    let delivery: Promise<void> = Promise.resolve();
    const polled = (async () => {
      try {
        await this.poll(changes, request);
      } finally {
        // Changes stored before a failure are still reported, each as this
        // poll left it. The snapshots are read while this run still holds
        // the guard, so no other poll can change a record first; reading
        // later, behind a slow callback, would show a later poll's state.
        let snapshots: DeliveryStatusChange[];
        try {
          snapshots = await Promise.all(
            changes.map((change) => this.readBack(change)),
          );
        } finally {
          // Only this run can be in flight until it clears the guard. It
          // does so before notifying, so a callback's own runOnce() starts
          // a new poll, and even if reading back failed, so later polls are
          // not stuck behind this one.
          this.runOnceInFlight = undefined;
        }
        // Without AsyncLocalStorage the caller may be a running callback,
        // which would wait forever for changes queued behind it, so they
        // are delivered at once instead.
        delivery =
          !callbackContext && this.activeDeliveries > 0
            ? this.deliverNow(snapshots)
            : this.queueNotifications(snapshots);
      }
    })();
    const delivered = polled.then(
      () => delivery,
      async (error: unknown) => {
        await delivery;
        throw error;
      },
    );
    // Each caller awaits one of the two; the other must not reject unseen.
    polled.catch(() => {});
    delivered.catch(() => {});
    const run = { polled, delivered };
    this.runOnceInFlight = run;
    return run;
  }

  private async poll(
    changes: DeliveryStatusChange[],
    request?: ProviderRequestContext,
  ): Promise<void> {
    const link = linkSignals(request?.signal, this.closing.signal);
    try {
      const { signal } = link;
      if (signal.aborted) return;

      const now = new Date();
      const { due, leaseUntil } = await this.takeDue(now);
      if (due.length === 0) return;
      const dueByMessageId = new Map(
        due.map((record) => [record.messageId, record]),
      );
      // Leased records the poll has not stored a next check for yet.
      const held = new Set(leaseUntil ? dueByMessageId.keys() : []);

      try {
        const { updates } = await reconcileDeliveryStatuses(
          this.providers,
          due,
          now,
          this.polling,
          { ...(request?.fetch ? { fetch: request.fetch } : {}), signal },
        );

        const failures: Array<{ messageId: string; error: unknown }> = [];
        for (const update of updates) {
          const patch = { ...update.patch, nextCheckAt: update.nextCheckAt };

          // If the record is terminal, keep it out of the due list.
          if (patch.status && isTerminalDeliveryStatus(patch.status)) {
            patch.nextCheckAt = now;
          }

          const originalRecord = dueByMessageId.get(update.messageId);
          const mergedRecord: TrackingRecord | undefined = originalRecord && {
            ...originalRecord,
            ...patch,
            messageId: originalRecord.messageId,
          };
          const failover =
            mergedRecord !== undefined &&
            this.shouldAttemptApiFailover(mergedRecord);
          // A stopped poll starts no fallback send. Storing the failure
          // without one would lose it, since a failed record is not polled
          // again, so the record stays as it was for the next poll.
          if (failover && signal.aborted) continue;

          // A record the store rejects is retried by a later poll; the rest
          // of the batch is still stored.
          let stored = false;
          try {
            await this.store.patch(update.messageId, patch);
            stored = true;
            held.delete(update.messageId);

            if (!originalRecord || !mergedRecord) continue;

            if (
              this.onStatusChange &&
              mergedRecord.status !== originalRecord.status
            ) {
              changes.push({
                record: mergedRecord,
                previousStatus: originalRecord.status,
              });
            }

            if (failover) {
              await this.attemptApiFailover(mergedRecord, now, signal);
            }
          } catch (error) {
            failures.push({ messageId: update.messageId, error });
            if (
              !stored &&
              (await this.deferRejectedUpdate(
                update.messageId,
                patch.attemptCount ??
                  (dueByMessageId.get(update.messageId)?.attemptCount ?? 0) + 1,
                now,
              ))
            ) {
              held.delete(update.messageId);
            }
          }
        }

        const [first] = failures;
        if (first) {
          const reason =
            first.error instanceof Error
              ? first.error.message
              : String(first.error);
          throw new AggregateError(
            failures.map((failure) => failure.error),
            `Delivery tracking could not update ${failures.length} of ${updates.length} polled messages; ${first.messageId}: ${reason}`,
          );
        }
      } finally {
        if (leaseUntil) await this.releaseLeases(held, leaseUntil, now);
      }
    } finally {
      link.unlink();
    }
  }

  // Due records, leased when the store can lease them.
  private async takeDue(
    now: Date,
  ): Promise<{ due: TrackingRecord[]; leaseUntil?: Date }> {
    const leaseMs = this.polling.leaseMs ?? 0;
    if (leaseMs > 0 && this.store.leaseDue) {
      const leaseUntil = new Date(now.getTime() + leaseMs);
      return {
        due: await this.store.leaseDue(now, this.polling.batchSize, leaseUntil),
        leaseUntil,
      };
    }
    return { due: await this.store.listDue(now, this.polling.batchSize) };
  }

  // Makes the records a poll leased but did not finish due again now,
  // rather than when their lease runs out. The store gives back only leases
  // the poll still holds; without releaseLeases they run out.
  private async releaseLeases(
    messageIds: Set<string>,
    leaseUntil: Date,
    now: Date,
  ): Promise<void> {
    if (messageIds.size === 0 || !this.store.releaseLeases) return;
    try {
      await this.store.releaseLeases([...messageIds], leaseUntil, now);
    } catch (error) {
      // They are due again when their lease runs out.
      logBackgroundFailure("Delivery tracking lease release failed", error);
    }
  }

  // The store rejected a record's update, for example a value too long for
  // its column. Count the check and move the record along its backoff
  // anyway, so a record the store keeps rejecting cannot take a batch slot
  // on every poll and keep the others from being polled. Reports whether
  // that was stored.
  private async deferRejectedUpdate(
    messageId: string,
    attemptCount: number,
    now: Date,
  ): Promise<boolean> {
    try {
      await this.store.patch(messageId, {
        attemptCount,
        lastCheckedAt: now,
        nextCheckAt: computeNextCheckAt(
          now,
          attemptCount,
          this.polling.backoffMs,
        ),
      });
      return true;
    } catch {
      // runOnce() reports the update's failure; the record stays due.
      return false;
    }
  }

  private queueNotifications(changes: DeliveryStatusChange[]): Promise<void> {
    if (changes.length === 0) return this.notificationTail;
    const delivered = this.notificationTail.then(() =>
      this.deliverAll(changes),
    );
    this.notificationTail = delivered;
    return delivered;
  }

  // Beside the batches being delivered, outside the queue. With no changes
  // it resolves at once, unlike queueNotifications: waiting for the queue
  // here would make a callback that polls again wait for its own batch.
  private deliverNow(changes: DeliveryStatusChange[]): Promise<void> {
    return changes.length === 0 ? Promise.resolve() : this.deliverAll(changes);
  }

  // notifyStatusChange never rejects, so neither does this.
  private async deliverAll(changes: DeliveryStatusChange[]): Promise<void> {
    this.activeDeliveries += 1;
    try {
      for (const change of changes) {
        await this.notifyStatusChange(change);
      }
    } finally {
      this.activeDeliveries -= 1;
    }
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

  // Runs the callbacks in the callback context, so a runOnce() they make is
  // known to come from a callback.
  private notifyStatusChange(change: DeliveryStatusChange): Promise<void> {
    return callbackContext
      ? callbackContext.run(true, () => this.deliverStatusChange(change))
      : this.deliverStatusChange(change);
  }

  private async deliverStatusChange(
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
    signal: AbortSignal,
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
      signal,
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
