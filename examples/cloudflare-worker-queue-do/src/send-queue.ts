import { DurableObject } from "cloudflare:workers";
import {
  type CloudflareObjectJob,
  type CloudflareObjectJobQueue,
  createDurableObjectJobQueue,
} from "@k-msg/messaging/adapters/cloudflare";
import { JobStatus } from "@k-msg/messaging/queue";
import { ErrorUtils, KMsg, type KMsgError } from "k-msg";
import { type Config, type Env, readConfig } from "./env";
import { log } from "./log";
import { createProvider, maskPhoneNumber } from "./providers";

/** A queued message. The sender number is added from config when it is sent. */
export interface SendJob {
  to: string;
  text: string;
}

export type EnqueueResult =
  | { outcome: "accepted" | "replayed"; jobId: string }
  | { outcome: "key_reused" };

/** A job as GET /messages/:jobId shows it, without the recipient or text. */
export interface JobView {
  jobId: string;
  status: JobStatus;
  failedAttempts: number;
  maxAttempts: number;
  createdAt: string;
  /** When a pending job is due. */
  nextAttemptAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  /**
   * Code of the last failed attempt: a KMsgErrorCode, or LEASE_EXPIRED when
   * the object stopped mid-send.
   */
  lastError: string | null;
  /** The provider that accepted the message, once it has. */
  providerId: string | null;
  providerMessageId: string | null;
}

/** What a sent job keeps, through complete(). */
interface SentResult {
  providerId: string;
  providerMessageId: string | null;
}

export interface DrainResult {
  processed: number;
  sent: number;
  retried: number;
  failed: number;
}

export interface Totals {
  enqueued: number;
  replayed: number;
  sent: number;
  retried: number;
  failed: number;
  interrupted: number;
  removedJobs: number;
  expiredKeys: number;
}

export interface QueueStats {
  /** Jobs due now. */
  dueJobs: number;
  /** Accepted jobs not yet sent or given up, including those waiting to retry. */
  openJobs: number;
  totals: Totals;
  nextAlarmAt: string | null;
  lastCleanupAt: string | null;
  nextCleanupAt: string | null;
}

interface StoredStats extends Totals {
  lastCleanupAt?: number;
  /** Set while there is something to clean up. */
  nextCleanupAt?: number;
}

interface IdempotencyRecord {
  jobId: string;
  /** SHA-256 of the message, to tell a retry from a different message. */
  fingerprint: string;
  expiresAt: number;
}

interface Sender {
  config: Config;
  kmsg: KMsg;
}

type Outcome = "sent" | "retried" | "failed";
type SendJobQueue = CloudflareObjectJobQueue<SendJob>;
type KeyValueStorage = Pick<DurableObjectStorage, "get" | "put">;
type AlarmStorage = Pick<DurableObjectStorage, "getAlarm" | "setAlarm">;

const QUEUE_KEY_PREFIX = "send-queue";
const IDEMPOTENCY_PREFIX = "idempotency/";
const STATS_KEY = "stats";

/**
 * A provider call that takes longer fails as NETWORK_TIMEOUT, a retryable
 * code. The SOLAPI SDK ignores the signal, so SOLAPI calls are not bounded.
 */
const SEND_TIMEOUT_MS = 10_000;
/**
 * A dequeued job is leased for this long. If the object stops mid-send, for
 * example during a deploy, the job is due again once its lease runs out,
 * with the lost attempt counted as failed. Far longer than a send takes.
 */
const LEASE_MS = 5 * 60_000;
/** Jobs per pass. A full pass leaves jobs due, so the alarm fires again at once. */
const BATCH_SIZE = 25;
/**
 * Finished jobs older than FINISHED_JOB_TTL_MS and expired idempotency keys
 * are deleted this often, starting one interval after the first job.
 */
const CLEANUP_INTERVAL_MS = 10 * 60_000;
/** How long a finished job's status stays readable. */
const FINISHED_JOB_TTL_MS = 60 * 60_000;
/** For this long, a repeated Idempotency-Key returns the original job. */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60_000;
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 5 * 60_000;
/** A provider's retryAfterMs is honored up to this long. */
const MAX_RETRY_DELAY_MS = 60 * 60_000;
// The idempotency-key scan reads this many keys at a time; Durable Object
// storage deletes at most 128 keys per delete() call.
const LIST_PAGE_SIZE = 1_000;
const MAX_KEYS_PER_DELETE = 128;

/**
 * Owns the send queue. Requests add jobs over RPC; the alarm sends them one
 * at a time, retries what can be retried and deletes what is finished.
 */
export class SendQueue extends DurableObject<Env> {
  private readonly queue = jobQueue(this.ctx.storage);
  // Built on first use; a Durable Object keeps its env until it restarts.
  private sender?: Promise<Sender>;
  private pass?: Promise<DrainResult>;

  /** Queues a message, once per idempotency key. */
  async enqueue(
    idempotencyKey: string,
    message: SendJob,
  ): Promise<EnqueueResult> {
    const { config } = await this.getSender();
    const fingerprint = await sha256Hex(`${message.to}\n${message.text}`);
    const key = IDEMPOTENCY_PREFIX + idempotencyKey;

    // The job, its idempotency record and the alarm are stored together, and
    // two concurrent requests with one key cannot both miss the record.
    return this.transaction(async (queue, txn): Promise<EnqueueResult> => {
      const now = Date.now();
      const seen = await txn.get<IdempotencyRecord>(key);
      if (seen !== undefined && seen.expiresAt > now) {
        if (seen.fingerprint !== fingerprint) return { outcome: "key_reused" };
        await count(txn, "replayed");
        return { outcome: "replayed", jobId: seen.jobId };
      }

      const job = await queue.enqueue("send", message, {
        maxAttempts: config.maxAttempts,
      });
      await txn.put<IdempotencyRecord>(key, {
        jobId: job.id,
        fingerprint,
        expiresAt: now + IDEMPOTENCY_TTL_MS,
      });
      await updateStats(txn, (stats) => ({
        ...stats,
        enqueued: stats.enqueued + 1,
        nextCleanupAt: stats.nextCleanupAt ?? now + CLEANUP_INTERVAL_MS,
      }));
      await wakeAt(txn, now);
      return { outcome: "accepted", jobId: job.id };
    });
  }

  async getJob(jobId: string): Promise<JobView | null> {
    const job = await this.queue.getJob(jobId);
    return job === undefined ? null : toJobView(job);
  }

  async stats(): Promise<QueueStats> {
    const { lastCleanupAt, nextCleanupAt, ...totals } = await readStats(
      this.ctx.storage,
    );
    const alarm = await this.ctx.storage.getAlarm();
    return {
      dueJobs: await this.queue.size(),
      openJobs: openJobs(totals),
      totals,
      nextAlarmAt: toIsoString(alarm),
      lastCleanupAt: toIsoString(lastCleanupAt),
      nextCleanupAt: toIsoString(nextCleanupAt),
    };
  }

  /** Sends the due jobs now instead of waiting for the alarm. */
  async drain(): Promise<DrainResult> {
    const result = await this.runPass();
    await this.scheduleNextAlarm();
    return result;
  }

  async alarm(): Promise<void> {
    await this.runPass();
    const { nextCleanupAt } = await readStats(this.ctx.storage);
    if (nextCleanupAt !== undefined && Date.now() >= nextCleanupAt) {
      await this.cleanup();
    }
    await this.scheduleNextAlarm();
  }

  private getSender(): Promise<Sender> {
    // A failed build is not kept, so a transient failure, such as a failed
    // provider import, does not fail every later pass.
    this.sender ??= createSender(this.env).catch((error: unknown) => {
      this.sender = undefined;
      throw error;
    });
    return this.sender;
  }

  /** One pass at a time: the alarm and POST /queue/drain share a running one. */
  private runPass(): Promise<DrainResult> {
    this.pass ??= this.processDueJobs().finally(() => {
      this.pass = undefined;
    });
    return this.pass;
  }

  private async processDueJobs(): Promise<DrainResult> {
    // A configuration error stops the pass before it touches a job.
    await this.getSender();

    const result: DrainResult = {
      processed: 0,
      sent: 0,
      retried: 0,
      failed: 0,
    };
    while (result.processed < BATCH_SIZE) {
      const job = await this.claimNextJob();
      if (job === undefined) break;
      const outcome = await this.send(job);
      result[outcome] += 1;
      result.processed += 1;
    }
    return result;
  }

  /**
   * Takes the next due job and leases it. In the same transaction, jobs whose
   * lease ran out mid-send are due again or failed (see jobQueue()).
   */
  private claimNextJob(): Promise<CloudflareObjectJob<SendJob> | undefined> {
    return this.transaction((queue) => queue.dequeue());
  }

  private async send(job: CloudflareObjectJob<SendJob>): Promise<Outcome> {
    const { config, kmsg } = await this.getSender();
    const attempt = job.attempts + 1;
    const fields = { jobId: job.id, attempt, to: maskPhoneNumber(job.data.to) };

    const result = await kmsg.send(
      {
        to: job.data.to,
        text: job.data.text,
        from: config.senderNumber,
        // The job id doubles as the k-msg message id, to match logs to jobs.
        messageId: job.id,
      },
      { signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
    );

    if (result.isSuccess) {
      const sent: SentResult = {
        providerId: result.value.providerId,
        providerMessageId: result.value.providerMessageId ?? null,
      };
      await this.settle("sent", (queue) => queue.complete(job.id, sent));
      log("info", "message sent", { ...fields, ...sent });
      return "sent";
    }

    const { error } = result;
    // The provider's own text stays in the logs; the job keeps only the code.
    const failure = {
      ...fields,
      code: error.code,
      providerErrorCode: error.providerErrorCode ?? null,
      httpStatus: error.httpStatus ?? null,
      error: error.message,
    };

    if (ErrorUtils.isRetryable(error) && attempt < job.maxAttempts) {
      const delayMs = retryDelayMs(error, attempt);
      await this.settle("retried", (queue) =>
        queue.fail(job.id, error.code, { enabled: true, delayMs }),
      );
      log("warn", "send failed; retry scheduled", { ...failure, delayMs });
      return "retried";
    }

    await this.settle("failed", (queue) => queue.fail(job.id, error.code));
    log("error", "send failed; giving up", {
      ...failure,
      maxAttempts: job.maxAttempts,
    });
    return "failed";
  }

  /** Records how an attempt ended, in the transaction that stores it. */
  private settle(
    outcome: Outcome,
    update: (queue: SendJobQueue) => Promise<void>,
  ): Promise<void> {
    return this.transaction(async (queue, txn) => {
      await update(queue);
      await count(txn, outcome);
    });
  }

  /**
   * Deletes jobs that finished over FINISHED_JOB_TTL_MS ago and expired
   * idempotency records.
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const removedJobs = await this.queue.cleanupTerminal({
      olderThan: new Date(now - FINISHED_JOB_TTL_MS),
    });
    const expiredKeys = await this.expireIdempotencyRecords(now);
    // Idempotency records outlive their jobs by far, so while any remain,
    // jobs may still finish and need another cleanup.
    const remaining = await this.ctx.storage.list({
      prefix: IDEMPOTENCY_PREFIX,
      limit: 1,
    });

    await updateStats(this.ctx.storage, (stats) => ({
      ...stats,
      removedJobs: stats.removedJobs + removedJobs,
      expiredKeys: stats.expiredKeys + expiredKeys,
      lastCleanupAt: now,
      nextCleanupAt: remaining.size > 0 ? now + CLEANUP_INTERVAL_MS : undefined,
    }));

    if (removedJobs > 0 || expiredKeys > 0) {
      log("info", "queue cleaned up", { removedJobs, expiredKeys });
    }
  }

  private async expireIdempotencyRecords(now: number): Promise<number> {
    let expired = 0;
    let startAfter: string | undefined;
    for (;;) {
      const page = await this.ctx.storage.list<IdempotencyRecord>({
        prefix: IDEMPOTENCY_PREFIX,
        limit: LIST_PAGE_SIZE,
        ...(startAfter === undefined ? {} : { startAfter }),
      });
      const keys: string[] = [];
      for (const [key, record] of page) {
        if (record.expiresAt <= now) keys.push(key);
      }
      for (let index = 0; index < keys.length; index += MAX_KEYS_PER_DELETE) {
        expired += await this.deleteIfExpired(
          keys.slice(index, index + MAX_KEYS_PER_DELETE),
          now,
        );
      }
      if (page.size < LIST_PAGE_SIZE) return expired;
      startAfter = [...page.keys()].at(-1);
    }
  }

  // Reads the keys again in the transaction that deletes them, so a key a
  // request has reused for a new job since the scan is kept.
  private deleteIfExpired(keys: string[], now: number): Promise<number> {
    return this.ctx.storage.transaction(async (txn) => {
      const current = await txn.get<IdempotencyRecord>(keys);
      const expired = [...current]
        .filter(([, record]) => record.expiresAt <= now)
        .map(([key]) => key);
      return expired.length === 0 ? 0 : txn.delete(expired);
    });
  }

  /**
   * Sets the alarm for whatever comes first: the next job due (a retry, or a
   * lease running out, and now when jobs are left after a full pass) or the
   * next cleanup.
   */
  private async scheduleNextAlarm(): Promise<void> {
    const stats = await readStats(this.ctx.storage);
    const candidates: number[] = [];

    const current = await this.ctx.storage.getAlarm();
    if (current !== null) candidates.push(current);
    const nextDue = await this.queue.nextDueAt();
    if (nextDue !== undefined) candidates.push(nextDue.getTime());
    if (stats.nextCleanupAt !== undefined) {
      candidates.push(stats.nextCleanupAt);
    }

    if (candidates.length > 0) {
      await this.ctx.storage.setAlarm(Math.min(...candidates));
    }
  }

  /**
   * Runs work in one storage transaction with the queue bound to it, so a
   * job's state and this object's bookkeeping change together or not at all.
   */
  private transaction<T>(
    work: (queue: SendJobQueue, txn: DurableObjectTransaction) => Promise<T>,
  ): Promise<T> {
    return this.ctx.storage.transaction((txn) => work(jobQueue(txn), txn));
  }
}

async function createSender(env: Env): Promise<Sender> {
  const config = readConfig(env);
  const provider = await createProvider(config.provider);
  return { config, kmsg: new KMsg({ providers: [provider] }) };
}

/**
 * The queue over this object's storage, or over a transaction so that its
 * changes commit with the bookkeeping around them.
 */
function jobQueue(
  storage: DurableObjectStorage | DurableObjectTransaction,
): SendJobQueue {
  return createDurableObjectJobQueue<SendJob>(storage, {
    keyPrefix: QUEUE_KEY_PREFIX,
    leaseMs: LEASE_MS,
    // A job whose send never finished, because the object stopped mid-send.
    // Whether the provider got it is unknown, so it is retried as a failed
    // attempt: a recipient may get the message twice, but it is never
    // dropped silently.
    onLeaseExpired: async (job) => {
      const retry = job.status === JobStatus.PENDING;
      if (retry) {
        await count(storage, "interrupted");
      } else {
        await count(storage, "interrupted", "failed");
      }
      log("warn", "job was interrupted mid-send", { jobId: job.id, retry });
    },
  });
}

/**
 * Exponential backoff from 2 s, capped at 5 min, with jitter so a burst of
 * failures does not retry in lockstep. Never sooner than the provider asked
 * (retryAfterMs, for example from a Retry-After header), up to 1 hour.
 */
function retryDelayMs(error: KMsgError, attempt: number): number {
  const backoff = Math.min(
    MAX_BACKOFF_MS,
    BASE_BACKOFF_MS * 2 ** (attempt - 1),
  );
  const jittered = backoff / 2 + Math.random() * (backoff / 2);
  const retryAfter = ErrorUtils.resolveRetryAfterMs(error) ?? 0;
  return Math.round(
    Math.min(MAX_RETRY_DELAY_MS, Math.max(jittered, retryAfter)),
  );
}

const NO_TOTALS: Totals = {
  enqueued: 0,
  replayed: 0,
  sent: 0,
  retried: 0,
  failed: 0,
  interrupted: 0,
  removedJobs: 0,
  expiredKeys: 0,
};

async function readStats(storage: KeyValueStorage): Promise<StoredStats> {
  const stored = await storage.get<StoredStats>(STATS_KEY);
  return { ...NO_TOTALS, ...stored };
}

async function updateStats(
  storage: KeyValueStorage,
  change: (stats: StoredStats) => StoredStats,
): Promise<void> {
  await storage.put(STATS_KEY, change(await readStats(storage)));
}

function count(
  storage: KeyValueStorage,
  ...names: (keyof Totals)[]
): Promise<void> {
  return updateStats(storage, (stats) => {
    const next = { ...stats };
    for (const name of names) next[name] += 1;
    return next;
  });
}

function openJobs(totals: Totals): number {
  return totals.enqueued - totals.sent - totals.failed;
}

/** Moves the alarm earlier when `time` comes first. */
async function wakeAt(storage: AlarmStorage, time: number): Promise<void> {
  const current = await storage.getAlarm();
  if (current === null || time < current) await storage.setAlarm(time);
}

function toJobView(job: CloudflareObjectJob<SendJob>): JobView {
  const sent = readSentResult(job.result);
  return {
    jobId: job.id,
    status: job.status,
    failedAttempts: job.attempts,
    maxAttempts: job.maxAttempts,
    createdAt: job.createdAt.toISOString(),
    nextAttemptAt:
      job.status === JobStatus.PENDING ? job.processAt.toISOString() : null,
    completedAt: job.completedAt?.toISOString() ?? null,
    failedAt: job.failedAt?.toISOString() ?? null,
    lastError: job.error ?? null,
    providerId: sent?.providerId ?? null,
    providerMessageId: sent?.providerMessageId ?? null,
  };
}

function readSentResult(result: unknown): SentResult | undefined {
  if (typeof result !== "object" || result === null) return undefined;
  const { providerId, providerMessageId } = result as Record<string, unknown>;
  if (typeof providerId !== "string") return undefined;
  return {
    providerId,
    providerMessageId:
      typeof providerMessageId === "string" ? providerMessageId : null,
  };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function toIsoString(time: number | null | undefined): string | null {
  return time === null || time === undefined
    ? null
    : new Date(time).toISOString();
}
