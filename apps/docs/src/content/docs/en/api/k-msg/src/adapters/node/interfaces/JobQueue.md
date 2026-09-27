---
editUrl: false
next: false
prev: false
title: "JobQueue"
---

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L40)

## Type Parameters

### T

`T`

## Methods

### cleanupTerminal()?

> `optional` **cleanupTerminal**(`statuses?`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L72)

#### Parameters

##### statuses?

[`JobStatus`](/en/api/messaging/src/queue/enumerations/jobstatus/)[]

#### Returns

`Promise`\<`number`\>

***

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L70)

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L54)

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

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L52)

#### Parameters

##### options?

[`JobDequeueOptions`](/en/api/messaging/src/queue/interfaces/jobdequeueoptions/)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L41)

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

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L56)

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

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L66)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L62)

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L68)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job-queue.interface.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job-queue.interface.ts#L64)

#### Returns

`Promise`\<`number`\>
