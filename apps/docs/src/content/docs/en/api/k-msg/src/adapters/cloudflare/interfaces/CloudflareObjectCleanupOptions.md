---
editUrl: false
next: false
prev: false
title: "CloudflareObjectCleanupOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L49)

## Properties

### olderThan?

> `optional` **olderThan?**: `Date`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L56)

Only remove jobs that finished (were completed or failed) before this
time, so a finished job stays readable for a while.

***

### statuses?

> `optional` **statuses?**: [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[]

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L51)

Default: completed and failed jobs.
