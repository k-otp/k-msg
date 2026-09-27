import { logFallbackFailure } from "../shared/log-fallback";
import {
  JOB_LEASE_EXPIRED,
  type Job,
  type JobLeaseOptions,
  type JobQueueCleanupOptions,
  JobStatus,
} from "./job-queue.interface";

// Longer leases are as good as none; Infinity turns them off.
const MAX_LEASE_MS = 365 * 24 * 60 * 60_000;

/**
 * `leaseMs` as a queue uses it: `Infinity` (no lease) unless it is set, and
 * otherwise whole milliseconds, as SQL queues store times: a fraction rounds
 * up.
 */
export function resolveLeaseMs(leaseMs: number | undefined): number {
  const resolved = leaseMs ?? Number.POSITIVE_INFINITY;
  if (
    typeof resolved !== "number" ||
    !(resolved > 0) ||
    (Number.isFinite(resolved) && resolved > MAX_LEASE_MS)
  ) {
    throw new RangeError(
      `leaseMs must be Infinity or a positive number of milliseconds up to ${MAX_LEASE_MS}, got ${String(resolved)}`,
    );
  }
  return Number.isFinite(resolved) ? Math.ceil(resolved) : resolved;
}

/**
 * The job as it is once its expired lease ends: due again from the lease's
 * end with the lost attempt counted, or failed with no attempts left.
 * `undefined` unless the job is processing under a lease that has expired.
 */
export function releaseExpiredLease<J extends Job<unknown>>(
  job: J,
  now: number,
): J | undefined {
  if (job.status !== JobStatus.PROCESSING) return undefined;
  const expiresAt = job.leaseExpiresAt?.getTime();
  if (expiresAt === undefined || expiresAt > now) return undefined;

  const attempts = job.attempts + 1;
  const released: J = {
    ...job,
    attempts,
    leaseExpiresAt: undefined,
    error: JOB_LEASE_EXPIRED,
  };
  return attempts < job.maxAttempts
    ? {
        ...released,
        status: JobStatus.PENDING,
        processAt: new Date(expiresAt),
      }
    : { ...released, status: JobStatus.FAILED, failedAt: new Date(now) };
}

/** Reports a settled lease to `onLeaseExpired`, logging what it throws. */
export async function notifyLeaseExpired<J extends Job<unknown>>(
  onLeaseExpired: JobLeaseOptions<J>["onLeaseExpired"],
  job: J,
): Promise<void> {
  if (!onLeaseExpired) return;
  try {
    await onLeaseExpired({ ...job });
  } catch (error) {
    logFallbackFailure(
      `[k-msg] onLeaseExpired threw for job ${job.id}; the job is stored as ${job.status}`,
      error,
    );
  }
}

/**
 * What `cleanupTerminal()` removes. Throws for an invalid `olderThan`, which
 * would otherwise match every job.
 */
export function resolveCleanupOptions(
  options: JobStatus[] | JobQueueCleanupOptions = {},
): { statuses: JobStatus[]; olderThan?: Date } {
  const { statuses = [JobStatus.COMPLETED, JobStatus.FAILED], olderThan } =
    Array.isArray(options) ? { statuses: options } : options;
  if (olderThan !== undefined && Number.isNaN(olderThan.getTime())) {
    throw new TypeError("olderThan must be a valid Date");
  }
  return { statuses, olderThan };
}
