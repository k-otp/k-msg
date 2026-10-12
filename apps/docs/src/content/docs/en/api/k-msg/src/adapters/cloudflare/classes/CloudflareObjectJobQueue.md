---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L79)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new CloudflareObjectJobQueue**\<`T`\>(`storage`, `options?`): `CloudflareObjectJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L85)

`options` may also be the key prefix.

#### Parameters

##### storage

[`CloudflareObjectStorage`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectstorage/)

##### options?

`string` \| [`CloudflareObjectJobQueueOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjobqueueoptions/)\<`T`\>

#### Returns

`CloudflareObjectJobQueue`\<`T`\>

## Accessors

### supportsCheckpoints

#### Get Signature

> **get** **supportsCheckpoints**(): `boolean`

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L207)

False for stores that cannot persist reliable message progress (such as KV).

##### Returns

`boolean`

False for stores that cannot persist reliable message progress (such as KV).

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`supportsCheckpoints`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#supportscheckpoints)

## Methods

### checkpoint()

> **checkpoint**(`jobId`, `data`, `attempt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:211](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L211)

Persist message progress before/after a send. Required by MessageJobProcessor.
Must reject with JobCheckpointLostError if the processing attempt no longer owns the job.

#### Parameters

##### jobId

`string`

##### data

`T`

##### attempt

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`checkpoint`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#checkpoint)

***

### cleanupTerminal()

> **cleanupTerminal**(`options?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:370](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L370)

Removes finished jobs: completed and failed ones by default, or those
with the given statuses, and with `olderThan`, only those that finished
before it.

#### Parameters

##### options?

[`JobQueueCleanupOptions`](/en/api/messaging/src/queue/interfaces/jobqueuecleanupoptions/) \| [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[]

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`cleanupTerminal`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#cleanupterminal)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:358](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L358)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### complete()

> **complete**(`jobId`, `result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L234)

Marks the job completed and keeps `result` with it when it can be
stored as JSON. A result that cannot be stored is logged and dropped,
never failing the completion, since callers such as `JobProcessor`
would treat that as a failed job and run it again.

#### Parameters

##### jobId

`string`

##### result?

`unknown`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`complete`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#complete)

***

### dequeue()

> **dequeue**(`options?`): `Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L130)

Takes the next due job and, with `leaseMs`, leases it. Jobs whose lease
expired are due again first, or fail when they have no attempts left.
Jobs in `options.running` are left as they are.

#### Parameters

##### options?

[`JobDequeueOptions`](/en/api/messaging/src/queue/interfaces/jobdequeueoptions/) = `{}`

#### Returns

`Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\>\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L96)

#### Parameters

##### type

`string`

##### data

`T`

##### options?

###### delay?

`number`

###### maxAttempts?

`number`

###### metadata?

`Record`\<`string`, `any`\>

###### priority?

`number`

#### Returns

`Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\>\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`enqueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#enqueue)

***

### fail()

> **fail**(`jobId`, `error`, `retry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L261)

A completed job stays completed, even for a worker whose lease expired.

#### Parameters

##### jobId

`string`

##### error

`string` \| `Error`

##### retry?

[`JobRetryDirective`](/en/api/messaging/src/queue/interfaces/jobretrydirective/) = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`fail`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#fail)

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:345](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L345)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`getJob`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#getjob)

***

### nextDueAt()

> **nextDueAt**(): `Promise`\<`Date` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:329](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L329)

When `dequeue()` next has work: the earliest due time of a pending job
or lease expiry of a processing one, and now for a processing job that
has no lease yet. A time in the past means `dequeue()` has work now,
even when it only settles an expired lease, so call `dequeue()` rather
than checking `size()`. `undefined` when no job is pending or leased.
Use it to set a Durable Object alarm instead of polling.

#### Returns

`Promise`\<`Date` \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`nextDueAt`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#nextdueat)

***

### peek()

> **peek**(): `Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:299](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L299)

The job `dequeue()` would take next, including one whose lease expired,
shown as it will be once it is due again. Changes nothing.

#### Returns

`Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:351](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L351)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`remove`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#remove)

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:311](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L311)

How many jobs are due now, including those whose lease expired.

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
