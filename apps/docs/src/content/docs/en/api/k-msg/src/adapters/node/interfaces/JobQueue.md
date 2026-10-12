---
editUrl: false
next: false
prev: false
title: "JobQueue"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L102)

## Type Parameters

### T

`T`

## Properties

### supportsCheckpoints?

> `readonly` `optional` **supportsCheckpoints?**: `boolean`

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L119)

False for stores that cannot persist reliable message progress (such as KV).

## Methods

### checkpoint()?

> `optional` **checkpoint**(`jobId`, `data`, `attempt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L122)

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

***

### cleanupTerminal()?

> `optional` **cleanupTerminal**(`options?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:153](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L153)

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

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L138)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L116)

#### Parameters

##### jobId

`string`

##### result?

`any`

#### Returns

`Promise`\<`void`\>

***

### dequeue()

> **dequeue**(`options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L114)

#### Parameters

##### options?

[`JobDequeueOptions`](/en/api/messaging/src/queue/interfaces/jobdequeueoptions/)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L103)

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

> **fail**(`jobId`, `error`, `retry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L124)

#### Parameters

##### jobId

`string`

##### error

`string` \| `Error`

##### retry?

[`JobRetryDirective`](/en/api/messaging/src/queue/interfaces/jobretrydirective/)

#### Returns

`Promise`\<`void`\>

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L134)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### nextDueAt()?

> `optional` **nextDueAt**(): `Promise`\<`Date` \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:146](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L146)

When `dequeue()` next has work: the earliest due time of a pending job
or, with leases, lease expiry of a processing one. A time in the past
means `dequeue()` has work now, even when it only settles an expired
lease. `undefined` when no job is pending or leased.

#### Returns

`Promise`\<`Date` \| `undefined`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L130)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L136)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L132)

#### Returns

`Promise`\<`number`\>
