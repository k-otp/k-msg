---
editUrl: false
next: false
prev: false
title: "JobSettleOptions"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L105)

Optional fence for `complete()` and `fail()`.

## Properties

### attempt?

> `optional` **attempt?**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:112](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L112)

The attempt (`job.attempts`) that owns the job. A queue that supports the
fence rejects with `JobCheckpointLostError` when the job is no longer
processing that attempt, so a stale worker cannot settle the job of the
worker that took it over. Without it, completing or failing is unfenced.
