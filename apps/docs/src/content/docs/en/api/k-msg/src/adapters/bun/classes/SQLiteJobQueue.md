---
editUrl: false
next: false
prev: false
title: "SQLiteJobQueue"
---

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L8)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new SQLiteJobQueue**\<`T`\>(`options?`): `SQLiteJobQueue`\<`T`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L11)

#### Parameters

##### options?

`SQLiteJobQueueOptions` = `{}`

#### Returns

`SQLiteJobQueue`\<`T`\>

## Methods

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:282](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L282)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `void`

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:286](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L286)

#### Returns

`void`

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L167)

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

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:141](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L141)

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L88)

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

> **fail**(`jobId`, `error`, `shouldRetry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:179](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L179)

#### Parameters

##### jobId

`string`

##### error

`string` | `Error`

##### shouldRetry?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`fail`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#fail)

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:251](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L251)

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

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:218](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L218)

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:268](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L268)

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

Defined in: [packages/messaging/src/queue/sqlite-job-queue.ts:239](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/sqlite-job-queue.ts#L239)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
