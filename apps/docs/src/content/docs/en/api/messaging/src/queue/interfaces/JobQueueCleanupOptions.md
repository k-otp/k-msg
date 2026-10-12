---
editUrl: false
next: false
prev: false
title: "JobQueueCleanupOptions"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L92)

## Properties

### olderThan?

> `optional` **olderThan?**: `Date`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L99)

Only remove jobs that finished (were completed or failed) before this
time, so a finished job stays readable for a while.

***

### statuses?

> `optional` **statuses?**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[]

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L94)

Default: completed and failed jobs.
