---
editUrl: false
next: false
prev: false
title: "JobDequeueOptions"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L31)

## Properties

### running?

> `optional` **running?**: `ReadonlySet`\<`string`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L37)

Ids of the jobs the caller is still running. A queue that leases jobs
leaves them alone, even once their lease has run out: it does not hand
them out again or count the lease as a lost attempt.
