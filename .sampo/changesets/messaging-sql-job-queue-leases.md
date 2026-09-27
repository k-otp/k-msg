---
npm/@k-msg/messaging: minor
---

The SQL job queues (`HyperdriveJobQueue`, and so `createD1JobQueue` and `createDrizzleJobQueue`, and `SQLiteJobQueue`) can lease the jobs they hand out, as the KV, R2 and Durable Object queues can, with the same `leaseMs` and `onLeaseExpired` options. Without a lease, `dequeue()` marks a job `processing` for good, so a job whose worker stopped mid-job is never tried again. With `leaseMs`, a job that is neither completed nor failed in time is due again at the next `dequeue()`, with the lost attempt counted as failed (`error: "LEASE_EXPIRED"`), or fails when no attempts are left. Leases are off by default.

The lease needs no schema change: while a job is processing under a lease, `process_at` holds when the lease ends, and the job carries it as `leaseExpiresAt`. `dequeue()` settles expired leases and takes the next job in one statement on Postgres (`FOR UPDATE SKIP LOCKED`), in two atomic statements on SQLite and D1, and in a transaction on MySQL. A job already `processing` when leases are turned on cannot be told from one whose lease expired, so it is due at once.

The SQL queues also:
- tell when they next have work: `nextDueAt()` is the earliest pending due time or lease end;
- no longer let `fail()` reopen a completed job, and count its attempt in SQL;
- take `cleanupTerminal({ olderThan, statuses })` to keep recently finished jobs, still accepting a statuses array.

`dequeue({ running })` leaves the jobs its caller is still running alone, as in the object queues, and with `onLeaseExpired` the callbacks run before `dequeue()` leases the job it returns. `size()` and `peek()` count a job whose lease has expired. In every queue, `leaseMs` and retry delays are whole milliseconds; a fraction rounds up. The shared `JobQueue` interface declares `nextDueAt()` and `cleanupTerminal(options)` as optional methods, `Job` has `leaseExpiresAt`, and `@k-msg/messaging/queue` exports `JOB_LEASE_EXPIRED` with the `JobLeaseOptions` and `JobQueueCleanupOptions` types. `SQLiteJobQueueOptions`, `HyperdriveJobQueueConfig` and `HyperdriveJobQueueOptions` are exported too.
