---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L31)

## Type Parameters

### T

`T`

## Properties

### keyPrefix?

> `optional` **keyPrefix?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L33)

Default: `kmsg/jobs`.

***

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L46)

How long a dequeued job may stay processing before it is due again
(default: `Infinity`, no lease). If it is neither completed nor failed
by then, for example because the worker stopped mid-job, the next
`dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`)
and makes the job due again, or fails it when no attempts are left.
Set it above the longest time a job can take: a lease is not renewed,
and a worker that outlives it can still complete or fail the job while
another worker has it. `dequeue()` leaves the jobs its caller names as
still running alone, which is how `JobProcessor` keeps a job it is
still running from being run again or counted as lost.

***

### onLeaseExpired?

> `optional` **onLeaseExpired?**: (`job`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L54)

Called by `dequeue()` for each job whose lease had expired, once the job
is stored pending again or, with no attempts left, failed. `dequeue()`
waits for it before it leases the job it returns, which may be the same
one, so it does not shorten that lease. What it throws is logged and
does not stop the dequeue.

#### Parameters

##### job

[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\>

#### Returns

`void` \| `Promise`\<`void`\>
