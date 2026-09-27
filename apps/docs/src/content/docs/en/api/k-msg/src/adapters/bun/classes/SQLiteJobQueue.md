---
editUrl: false
next: false
prev: false
title: "SQLiteJobQueue"
---

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L51)

A job queue in a SQLite database.

With `leaseMs`, a processing job's `process_at` holds its lease's end, so
the table needs no new column. A job already processing without a lease,
taken by an earlier version or by a queue without `leaseMs`, cannot be
told from one whose lease has expired, so it is due at once.

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new SQLiteJobQueue**\<`T`\>(`options?`): `SQLiteJobQueue`\<`T`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L56)

#### Parameters

##### options?

[`SQLiteJobQueueOptions`](/en/api/k-msg/src/adapters/bun/interfaces/sqlitejobqueueoptions/)\<`T`\> = `{}`

#### Returns

`SQLiteJobQueue`\<`T`\>

## Methods

### cleanupTerminal()

> **cleanupTerminal**(`options?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:435](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L435)

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

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:426](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L426)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `void`

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:466](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L466)

#### Returns

`void`

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:277](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L277)

#### Parameters

##### jobId

`string`

##### \_result?

`any`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`complete`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#complete)

***

### dequeue()

> **dequeue**(`options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:212](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L212)

Takes the next due job and, with `leaseMs`, leases it. Jobs whose lease
expired are due again first, or fail when they have no attempts left.

#### Parameters

##### options?

[`JobDequeueOptions`](/en/api/messaging/src/queue/interfaces/jobdequeueoptions/) = `{}`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L155)

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

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`enqueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#enqueue)

***

### fail()

> **fail**(`jobId`, `error`, `retry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:294](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L294)

Counts a failed attempt: the job is due again after `retry.delayMs` when
retries are enabled and attempts are left, and fails otherwise. A
completed job stays completed, even for a worker whose lease expired.

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

> **getJob**(`jobId`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:396](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L396)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`getJob`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#getjob)

***

### nextDueAt()

> **nextDueAt**(): `Promise`\<`Date` \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:380](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L380)

When `dequeue()` next has work: the earliest due time of a pending job
or, with `leaseMs`, lease expiry of a processing one. A time in the past
means `dequeue()` has work now, even when it only settles an expired
lease, so call `dequeue()` rather than checking `size()`. `undefined`
when no job is pending or leased.

#### Returns

`Promise`\<`Date` \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`nextDueAt`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#nextdueat)

***

### peek()

> **peek**(): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:341](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L341)

The job `dequeue()` would take next, including one whose lease expired,
shown as it will be once it is due again. Changes nothing.

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:412](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L412)

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

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:362](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L362)

How many jobs are due now, including those whose lease expired.

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
