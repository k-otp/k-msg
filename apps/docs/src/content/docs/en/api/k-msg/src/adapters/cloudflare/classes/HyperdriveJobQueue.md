---
editUrl: false
next: false
prev: false
title: "HyperdriveJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L120)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L128)

#### Parameters

##### client

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### options?

[`HyperdriveJobQueueOptions`](/en/api/k-msg/src/adapters/cloudflare/type-aliases/hyperdrivejobqueueoptions/)\<`T`\> = `{}`

#### Returns

`HyperdriveJobQueue`\<`T`\>

## Methods

### cleanupTerminal()

> **cleanupTerminal**(`options?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:401](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L401)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:391](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L391)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:442](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L442)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:245](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L245)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:225](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L225)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:159](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L159)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:264](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L264)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:361](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L361)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:141](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L141)

#### Returns

`Promise`\<`void`\>

***

### nextDueAt()

> **nextDueAt**(): `Promise`\<`Date` \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:347](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L347)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:306](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L306)

The job `dequeue()` would take next, including one whose lease expired,
shown as it will be once it is due again. Changes nothing.

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:375](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L375)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:326](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L326)

How many jobs are due now, including those whose lease expired.

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
