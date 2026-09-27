---
editUrl: false
next: false
prev: false
title: "HyperdriveJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L75)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new HyperdriveJobQueue**\<`T`\>(`client`, `options?`): `HyperdriveJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L80)

#### Parameters

##### client

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### options?

`HyperdriveJobQueueOptions` = `{}`

#### Returns

`HyperdriveJobQueue`\<`T`\>

## Methods

### cleanupTerminal()

> **cleanupTerminal**(`statuses?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:355](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L355)

#### Parameters

##### statuses?

[`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[] = `...`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`cleanupTerminal`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#cleanupterminal)

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:350](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L350)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:386](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L386)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:230](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L230)

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

> **dequeue**(): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:168](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L168)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L107)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:244](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L244)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:320](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L320)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L90)

#### Returns

`Promise`\<`void`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:289](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L289)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:334](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L334)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:306](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L306)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
