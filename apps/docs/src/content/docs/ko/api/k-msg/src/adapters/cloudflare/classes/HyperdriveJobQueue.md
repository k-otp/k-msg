---
editUrl: false
next: false
prev: false
title: "HyperdriveJobQueue"
---

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:3

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new HyperdriveJobQueue**\<`T`\>(`client`, `tableName?`): `HyperdriveJobQueue`\<`T`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:7

#### Parameters

##### client

[`CloudflareSqlClient`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### tableName?

`string`

#### Returns

`HyperdriveJobQueue`\<`T`\>

## Methods

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:22

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:23

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:16

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

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:15

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:9

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

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:17

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

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:20

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`getJob`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#getjob)

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:8

#### Returns

`Promise`\<`void`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:18

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:21

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

Defined in: packages/messaging/dist/adapters/cloudflare/hyperdrive-job-queue.d.ts:19

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
