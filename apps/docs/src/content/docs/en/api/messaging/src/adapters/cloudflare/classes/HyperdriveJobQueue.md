---
editUrl: false
next: false
prev: false
title: "HyperdriveJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L38)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new HyperdriveJobQueue**\<`T`\>(`client`, `tableName?`): `HyperdriveJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L41)

#### Parameters

##### client

[`CloudflareSqlClient`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### tableName?

`string` = `"kmsg_jobs"`

#### Returns

`HyperdriveJobQueue`\<`T`\>

## Methods

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:326](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L326)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`clear`](/api/messaging/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:331](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L331)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:216](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L216)

#### Parameters

##### jobId

`string`

##### \_result?

`any`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`complete`](/api/messaging/src/adapters/node/interfaces/jobqueue/#complete)

***

### dequeue()

> **dequeue**(): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:154](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L154)

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/api/messaging/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L80)

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

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\>\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`enqueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/#enqueue)

***

### fail()

> **fail**(`jobId`, `error`, `shouldRetry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:227](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L227)

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

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`fail`](/api/messaging/src/adapters/node/interfaces/jobqueue/#fail)

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:296](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L296)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`getJob`](/api/messaging/src/adapters/node/interfaces/jobqueue/#getjob)

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L46)

#### Returns

`Promise`\<`void`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:265](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L265)

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`peek`](/api/messaging/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:310](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L310)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`remove`](/api/messaging/src/adapters/node/interfaces/jobqueue/#remove)

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:282](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L282)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`size`](/api/messaging/src/adapters/node/interfaces/jobqueue/#size)
