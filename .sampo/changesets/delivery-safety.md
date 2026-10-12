---
npm/@k-msg/messaging: minor
---

**Breaking (pre-1.0 minor):** `MessageJobProcessor` saves each recipient's progress before it sends, so a retry, a restart or a stale worker never sends to a recipient that already has a result. It does not promise exactly-once delivery: an unfinished send is an unknown outcome to reconcile with the provider.

Upgrade notes:

- Drain in-flight jobs first. Jobs created by earlier versions carry no receipts, so a pending or processing one is sent in full again when the new processor takes it. Stop producers, let the old workers finish the pending and processing jobs, then deploy.
- Recipients are sent one at a time, so progress can be saved before each send. `concurrency` limits jobs, not recipients.
- Only `RATE_LIMIT_EXCEEDED` is retried, and only for the recipients that were rate limited. Every other failure, including provider 5xx, authentication and balance errors, is final for that recipient and is not retried.
- `job.error` and the `job:failed` event hold a summary (the number of failed recipients and the position and error code of the first), not the provider's message. Per-recipient detail is in the receipts under `__kmsgDelivery` in the job data, a key that is now reserved: requests that carry it are refused.
- A message job holds at most `maxRecipientsPerJob` (default 1000) recipients and about `maxJobBytes` (default 1,000,000), or enqueueing throws `MessageJobTooLargeError`. Every checkpoint rewrites the job row, so larger lists belong in several jobs.
- A custom `JobQueue` still compiles, because `checkpoint` is optional, but `MessageJobProcessor` throws when it is constructed with a queue that lacks `checkpoint(jobId, data, attempt)`. It must save the data atomically with the check that the job is still processing that attempt, reject with `JobCheckpointLostError` otherwise, and renew the lease. `complete()` and `fail()` take an optional `{ attempt }` fence.
- `SQLiteJobQueue`, `HyperdriveJobQueue` (D1, Postgres, MySQL) and Durable Object queues support checkpoints. KV queues and R2 queues do not: their read-then-write check cannot fence a stale worker.
- `checkpoint()` renews the lease, so with `leaseMs` a job only has to outlast one send.
- Drizzle's postgres-js driver now reports changed rows, so `remove()` returns `true` for a removed job.
