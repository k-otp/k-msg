---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L105)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new CloudflareObjectJobQueue**\<`T`\>(`storage`, `options?`): `CloudflareObjectJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L111)

`options` may also be the key prefix.

#### Parameters

##### storage

[`CloudflareObjectStorage`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectstorage/)

##### options?

`string` \| [`CloudflareObjectJobQueueOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjobqueueoptions/)\<`T`\>

#### Returns

`CloudflareObjectJobQueue`\<`T`\>

## Methods

### cleanupTerminal()

> **cleanupTerminal**(`options?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:383](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L383)

Removes finished jobs: completed and failed ones by default, or those
with the given statuses, and with `olderThan`, only those that finished
before it.

#### Parameters

##### options?

[`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[] \| [`CloudflareObjectCleanupOptions`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectcleanupoptions/)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`cleanupTerminal`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#cleanupterminal)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:371](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L371)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### complete()

> **complete**(`jobId`, `result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:247](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L247)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L166)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L132)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:274](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L274)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:358](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L358)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:342](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L342)

When `dequeue()` next has work: the earliest due time of a pending job
or lease expiry of a processing one, and now for a processing job that
has no lease yet. A time in the past means `dequeue()` has work now,
even when it only settles an expired lease, so call `dequeue()` rather
than checking `size()`. `undefined` when no job is pending or leased.
Use it to set a Durable Object alarm instead of polling.

#### Returns

`Promise`\<`Date` \| `undefined`\>

***

### peek()

> **peek**(): `Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:312](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L312)

The job `dequeue()` would take next, including one whose lease expired,
shown as it will be once it is due again. Changes nothing.

#### Returns

`Promise`\<[`CloudflareObjectJob`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectjob/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:364](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L364)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:324](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L324)

How many jobs are due now, including those whose lease expired.

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
