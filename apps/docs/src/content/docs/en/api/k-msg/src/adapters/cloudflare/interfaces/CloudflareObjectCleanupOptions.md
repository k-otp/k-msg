---
editUrl: false
next: false
prev: false
title: "CloudflareObjectCleanupOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L57)

## Properties

### olderThan?

> `optional` **olderThan?**: `Date`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L64)

Only remove jobs that finished (were completed or failed) before this
time, so a finished job stays readable for a while.

***

### statuses?

> `optional` **statuses?**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[]

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L59)

Default: completed and failed jobs.
