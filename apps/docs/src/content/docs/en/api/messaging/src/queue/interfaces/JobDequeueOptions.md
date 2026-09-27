---
editUrl: false
next: false
prev: false
title: "JobDequeueOptions"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L39)

## Properties

### running?

> `optional` **running?**: `ReadonlySet`\<`string`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L47)

Ids of the jobs the caller is still running. A queue that leases jobs
leaves them alone, even once their lease has run out: it does not hand
them out again or count the lease as a lost attempt. It reads the set
once, when `dequeue()` starts, so a job that finishes during the call
is still left alone.
