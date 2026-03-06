---
editUrl: false
next: false
prev: false
title: "HyperdriveJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L43)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new HyperdriveJobQueue**\<`T`\>(`client`, `tableName?`): `HyperdriveJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L46)

#### Parameters

##### client

[`CloudflareSqlClient`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### tableName?

`string` = `"kmsg_jobs"`

#### Returns

`HyperdriveJobQueue`\<`T`\>

## Methods

### cleanupTerminal()

> **cleanupTerminal**(`statuses?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:323](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L323)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:318](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L318)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`clear`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#clear)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:354](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L354)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:198](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L198)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L136)

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L67)

#### Parameters

##### type

`string`

##### data

`T`

##### options?

\{ `delay?`: `number`; `maxAttempts?`: `number`; `metadata?`: `Record`\<`string`, `any`\>; `priority?`: `number`; \} | `undefined`

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`enqueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#enqueue)

***

### fail()

> **fail**(`jobId`, `error`, `retry?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:212](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L212)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:288](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L288)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L51)

#### Returns

`Promise`\<`void`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:257](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L257)

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`peek`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:302](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L302)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts:274](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-job-queue.ts#L274)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/).[`size`](/api/k-msg/src/adapters/node/interfaces/jobqueue/#size)
