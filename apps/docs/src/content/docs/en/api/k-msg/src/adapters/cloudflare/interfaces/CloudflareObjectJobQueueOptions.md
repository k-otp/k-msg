---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L29)

## Type Parameters

### T

`T`

## Properties

### keyPrefix?

> `optional` **keyPrefix?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L31)

Default: `kmsg/jobs`.

***

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L40)

How long a dequeued job may stay processing (default: 5 minutes). If it
is neither completed nor failed by then, for example because the worker
stopped mid-job, it is due again, and the lost attempt counts as a
failed one (`error: "LEASE_EXPIRED"`); a job with no attempts left
fails. Set it above the longest time a job can take. `Infinity` keeps
dequeued jobs processing until they are completed or failed.

***

### onLeaseExpired?

> `optional` **onLeaseExpired?**: (`job`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L46)

Called by `dequeue()` for each job whose lease it found expired, with
the job as stored after: pending again, or failed if it had no attempts
left. What it throws is logged and does not stop the dequeue.

#### Parameters

##### job

[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\>

#### Returns

`void` \| `Promise`\<`void`\>
