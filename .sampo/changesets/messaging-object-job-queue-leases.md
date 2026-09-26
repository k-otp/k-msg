---
npm/@k-msg/messaging: minor
---

The KV, R2 and Durable Object job queues (`CloudflareObjectJobQueue`) can lease the jobs they hand out, with the new `leaseMs` option. Without a lease, `dequeue()` marks a job `processing` for good, so a job whose worker stopped mid-job (a deploy, an evicted Durable Object) is never tried again. A leased job carries `leaseExpiresAt`. If it is neither completed nor failed in time, the next `dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`, exported as `JOB_LEASE_EXPIRED`) and makes the job due again, or fails it when no attempts are left, then reports it through `onLeaseExpired(job)`. Leases are off by default, so existing queues behave as before. With leases on, a job already `processing` without a lease gets one when `dequeue()` first sees it, and is retried if it is still unfinished when that lease ends. Leases are not renewed and not fenced, so `leaseMs` must exceed the longest job.

The queue also:
- tells when it next has work: `nextDueAt()` is the earliest pending due time or lease end, so a Durable Object alarm no longer has to poll;
- keeps what `complete(jobId, result)` is given as `result`, such as a provider message id, unless JSON cannot hold it or the storage rejects it, in which case the job completes without it;
- no longer lets `fail()` reopen a completed job;
- takes `cleanupTerminal({ olderThan, statuses })` to keep recently finished jobs, still accepting a statuses array.

`size()` and `peek()` also count a job whose lease has expired. The constructor takes these options or a key prefix, and `createKvJobQueue`, `createR2JobQueue` and `createDurableObjectJobQueue` take them too. `JobProcessor` no longer runs a job again when a queue hands it back while it is still running.
