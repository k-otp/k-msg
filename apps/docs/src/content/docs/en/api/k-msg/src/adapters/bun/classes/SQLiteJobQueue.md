---
editUrl: false
next: false
prev: false
title: "SQLiteJobQueue"
---

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L13)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new SQLiteJobQueue**\<`T`\>(`options?`): `SQLiteJobQueue`\<`T`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L16)

#### Parameters

##### options?

`SQLiteJobQueueOptions` = `{}`

#### Returns

`SQLiteJobQueue`\<`T`\>

## Methods

### cleanupTerminal()

> **cleanupTerminal**(`statuses?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:293](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L293)

#### Parameters

##### statuses?

[`JobStatus`](/api/messaging/src/queue/enumerations/jobstatus/)[] = `...`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`cleanupTerminal`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#cleanupterminal)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:289](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L289)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `void`

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:314](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L314)

#### Returns

`void`

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L172)

#### Parameters

##### jobId

`string`

##### \_result?

`any`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`complete`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#complete)

***

### dequeue()

> **dequeue**(): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:146](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L146)

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L93)

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

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`enqueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#enqueue)

***

### fail()

> **fail**(`jobId`, `error`, `retry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:184](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L184)

#### Parameters

##### jobId

`string`

##### error

`string` | `Error`

##### retry?

[`JobRetryDirective`](/api/messaging/src/queue/interfaces/jobretrydirective/) = `...`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`fail`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#fail)

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:258](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L258)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`getJob`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#getjob)

***

### peek()

> **peek**(): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:225](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L225)

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:275](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L275)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`remove`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#remove)

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:246](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L246)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
