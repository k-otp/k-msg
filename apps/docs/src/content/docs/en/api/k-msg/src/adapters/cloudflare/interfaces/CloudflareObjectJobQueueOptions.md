---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueueOptions"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L34)

Options of the queues that lease the jobs `dequeue()` returns.

## Extends

- [`JobLeaseOptions`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/)\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\>\>

## Type Parameters

### T

`T`

## Properties

### keyPrefix?

> `optional` **keyPrefix?**: `string`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L37)

Default: `kmsg/jobs`.

***

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L83)

How long a dequeued job may stay processing before it is due again
(default: `Infinity`, no lease). If it is neither completed nor failed
by then, for example because the worker stopped mid-job, the next
`dequeue()` counts the lost attempt as failed (`error: "LEASE_EXPIRED"`)
and makes the job due again, or fails it when no attempts are left.
Set it above the longest time a job can take. Only `checkpoint()` renews
a lease, which message jobs do before every recipient, so for them it
only has to outlast one send. A worker that outlives its lease can still
complete or fail the job while another worker has it, unless the caller
fences the call with `JobSettleOptions.attempt` (message jobs do). `dequeue()` leaves the jobs its caller names as
still running alone, which is how `JobProcessor` keeps a job it is
still running from being run again or counted as lost.

#### Inherited from

[`JobLeaseOptions`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/).[`leaseMs`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/#leasems)

***

### onLeaseExpired?

> `optional` **onLeaseExpired?**: (`job`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L91)

Called by `dequeue()` for each job whose lease had expired, once the job
is stored pending again or, with no attempts left, failed. `dequeue()`
waits for it before it leases the job it returns, which may be the same
one, so it does not shorten that lease. What it throws is logged and
does not stop the dequeue.

#### Parameters

##### job

[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`JobLeaseOptions`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/).[`onLeaseExpired`](/en/api/messaging/src/queue/interfaces/jobleaseoptions/#onleaseexpired)
