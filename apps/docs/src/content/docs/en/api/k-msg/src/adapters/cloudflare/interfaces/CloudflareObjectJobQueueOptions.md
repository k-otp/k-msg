---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L30)

## Type Parameters

### T

`T`

## Properties

### keyPrefix?

> `optional` **keyPrefix?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L32)

Default: `kmsg/jobs`.

***

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L43)

How long a dequeued job may stay processing before it is due again
(default: `Infinity`, no lease). If it is neither completed nor failed
by then, for example because the worker stopped mid-job, the next
`dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`)
and makes the job due again, or fails it when no attempts are left.
Set it above the longest time a job can take: a lease is not renewed,
and a worker that outlives it can still complete or fail the job while
another worker has it.

***

### onLeaseExpired?

> `optional` **onLeaseExpired?**: (`job`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L50)

Called by `dequeue()` for each job whose lease had expired, once
`dequeue()` has stored its changes: with the job pending again (the same
`dequeue()` may have taken it again) or failed if it had no attempts
left. What it throws is logged and does not stop the dequeue.

#### Parameters

##### job

[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\>

#### Returns

`void` \| `Promise`\<`void`\>
