---
editUrl: false
next: false
prev: false
title: "JobLeaseOptions"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L51)

Options of the queues that lease the jobs `dequeue()` returns.

## Extended by

- [`CreateD1JobQueueOptions`](/en/api/messaging/src/adapters/cloudflare/interfaces/created1jobqueueoptions/)
- [`CreateDrizzleJobQueueOptions`](/en/api/messaging/src/adapters/cloudflare/interfaces/createdrizzlejobqueueoptions/)
- [`SQLiteJobQueueOptions`](/en/api/k-msg/src/adapters/bun/interfaces/sqlitejobqueueoptions/)
- [`CloudflareObjectJobQueueOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjobqueueoptions/)
- [`HyperdriveJobQueueConfig`](/en/api/k-msg/src/adapters/cloudflare/interfaces/hyperdrivejobqueueconfig/)

## Type Parameters

### J

`J`

## Properties

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L64)

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

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L72)

Called by `dequeue()` for each job whose lease had expired, once the job
is stored pending again or, with no attempts left, failed. `dequeue()`
waits for it before it leases the job it returns, which may be the same
one, so it does not shorten that lease. What it throws is logged and
does not stop the dequeue.

#### Parameters

##### job

`J`

#### Returns

`void` \| `Promise`\<`void`\>
