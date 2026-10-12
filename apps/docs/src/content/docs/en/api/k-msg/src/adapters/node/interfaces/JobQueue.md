---
editUrl: false
next: false
prev: false
title: "JobQueue"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L115)

## Type Parameters

### T

`T`

## Properties

### supportsCheckpoints?

> `readonly` `optional` **supportsCheckpoints?**: `boolean`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L136)

False for stores that cannot persist reliable message progress (such as KV).

## Methods

### checkpoint()?

> `optional` **checkpoint**(`jobId`, `data`, `attempt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L145)

Persist message progress before a send. Required by MessageJobProcessor.
Replaces the job's `data` atomically with the attempt check, so a stale
attempt cannot overwrite the progress of the one that took the job over:
it must reject with `JobCheckpointLostError` if the processing attempt no
longer owns the job. With `leaseMs`, it also renews the lease from now, so
a job that checkpoints after every recipient does not outlive its lease.

#### Parameters

##### jobId

`string`

##### data

`T`

##### attempt

`number`

#### Returns

`Promise`\<`void`\>

***

### cleanupTerminal()?

> `optional` **cleanupTerminal**(`options?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:177](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L177)

Removes finished jobs: completed and failed ones by default, or those
with the given statuses, and with `olderThan`, only those that finished
before it.

#### Parameters

##### options?

[`JobQueueCleanupOptions`](/en/api/messaging/src/queue/interfaces/jobqueuecleanupoptions/) \| [`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[]

#### Returns

`Promise`\<`number`\>

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:162](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L162)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `result?`, `options?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L129)

#### Parameters

##### jobId

`string`

##### result?

`any`

##### options?

[`JobSettleOptions`](/en/api/k-msg/src/adapters/node/interfaces/jobsettleoptions/)

#### Returns

`Promise`\<`void`\>

***

### dequeue()

> **dequeue**(`options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L127)

#### Parameters

##### options?

[`JobDequeueOptions`](/en/api/messaging/src/queue/interfaces/jobdequeueoptions/)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L116)

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

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

***

### fail()

> **fail**(`jobId`, `error`, `retry?`, `options?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:147](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L147)

#### Parameters

##### jobId

`string`

##### error

`string` \| `Error`

##### retry?

[`JobRetryDirective`](/en/api/messaging/src/queue/interfaces/jobretrydirective/)

##### options?

[`JobSettleOptions`](/en/api/k-msg/src/adapters/node/interfaces/jobsettleoptions/)

#### Returns

`Promise`\<`void`\>

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:158](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L158)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### nextDueAt()?

> `optional` **nextDueAt**(): `Promise`\<`Date` \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L170)

When `dequeue()` next has work: the earliest due time of a pending job
or, with leases, lease expiry of a processing one. A time in the past
means `dequeue()` has work now, even when it only settles an expired
lease. `undefined` when no job is pending or leased.

#### Returns

`Promise`\<`Date` \| `undefined`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:154](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L154)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:160](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L160)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L156)

#### Returns

`Promise`\<`number`\>
