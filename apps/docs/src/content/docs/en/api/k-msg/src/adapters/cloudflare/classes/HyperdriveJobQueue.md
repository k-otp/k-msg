---
editUrl: false
next: false
prev: false
title: "HyperdriveJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L124)

A job queue in a SQL table on D1 or another SQLite, Postgres (Hyperdrive)
or MySQL.

With `leaseMs`, a processing job's `process_at` holds its lease's end, so
the table needs no new column. `dequeue()` settles expired leases and takes
the next job with statements that each settle or take a job only once:
Postgres skips rows another `dequeue()` has locked, SQLite runs each
statement under its write lock, and MySQL locks the rows it changes, which
holds only when the client provides `transaction()`. Without
`onLeaseExpired`, Postgres does both in one statement; with it, the
callbacks run between the two, so they do not shorten the new lease.

A job already processing without a lease, taken by an earlier version or
by a queue without `leaseMs`, cannot be told from one whose lease has
expired, so it is due at once.

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new HyperdriveJobQueue**\<`T`\>(`client`, `options?`): `HyperdriveJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L132)

#### Parameters

##### client

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### options?

[`HyperdriveJobQueueOptions`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/hyperdrivejobqueueoptions/)\<`T`\> = `{}`

#### Returns

`HyperdriveJobQueue`\<`T`\>

## Methods

### checkpoint()

> **checkpoint**(`jobId`, `data`, `attempt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:249](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L249)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:432](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L432)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:422](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L422)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:473](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L473)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:276](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L276)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:229](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L229)

Takes the next due job and, with `leaseMs`, leases it. Jobs whose lease
expired are due again first, or fail when they have no attempts left.
Jobs in `options.running` are left as they are.

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:163](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L163)

#### Parameters

##### type

`string`

##### data

`T`

##### options?

\{ `delay?`: `number`; `maxAttempts?`: `number`; `metadata?`: `Record`\<`string`, `any`\>; `priority?`: `number`; \} \| `undefined`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`enqueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#enqueue)

***

### fail()

> **fail**(`jobId`, `error`, `retry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:295](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L295)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:392](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L392)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`getJob`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#getjob)

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L145)

#### Returns

`Promise`\<`void`\>

***

### nextDueAt()

> **nextDueAt**(): `Promise`\<`Date` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:378](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L378)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:337](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L337)

The job `dequeue()` would take next, including one whose lease expired,
shown as it will be once it is due again. Changes nothing.

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:406](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L406)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:357](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L357)

How many jobs are due now, including those whose lease expired.

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
