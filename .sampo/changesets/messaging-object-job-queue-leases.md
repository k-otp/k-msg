---
npm/@k-msg/messaging: minor
---

The KV, R2 and Durable Object job queues (`CloudflareObjectJobQueue`) lease the jobs they hand out. `dequeue()` marked a job `processing` for good, so a job whose worker stopped mid-job (a deploy, an evicted Durable Object) was never tried again. Now a dequeued job carries `leaseExpiresAt`. If it is neither completed nor failed within `leaseMs` (default 5 minutes; `Infinity` turns leases off), the next `dequeue()` makes it due again and counts the lost attempt as failed (`error: "LEASE_EXPIRED"`, exported as `JOB_LEASE_EXPIRED`); a job with no attempts left fails. Jobs already stuck in `processing` are retried this way after the upgrade. `onLeaseExpired(job)` reports each such job.

Other changes:
- `nextDueAt()` returns when a job is next due, a pending job or an expiring lease, so a Durable Object alarm can be set for then instead of polling.
- `size()` and `peek()` also count a job whose lease has expired.
- `complete(jobId, result)` keeps `result` on the job, and `fail()` no longer reopens a completed job.
- `cleanupTerminal({ olderThan, statuses })` can keep recently finished jobs; it still accepts a statuses array.
- `createKvJobQueue`, `createR2JobQueue` and `createDurableObjectJobQueue` take the new options, and the constructor accepts an options object as well as a key prefix.
