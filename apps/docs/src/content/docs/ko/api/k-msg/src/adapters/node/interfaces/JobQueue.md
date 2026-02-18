---
editUrl: false
next: false
prev: false
title: "JobQueue"
---

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:24

## Type Parameters

### T

`T`

## Methods

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:38

#### Returns

`Promise`\<`void`\>

***

### complete()

> **complete**(`jobId`, `result?`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:32

#### Parameters

##### jobId

`string`

##### result?

`any`

#### Returns

`Promise`\<`void`\>

***

### dequeue()

> **dequeue**(): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:31

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:25

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

***

### fail()

> **fail**(`jobId`, `error`, `shouldRetry?`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:33

#### Parameters

##### jobId

`string`

##### error

`string` | `Error`

##### shouldRetry?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:36

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### peek()

> **peek**(): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:34

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:37

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### size()

> **size**(): `Promise`\<`number`\>

Defined in: packages/messaging/dist/queue/job-queue.interface.d.ts:35

#### Returns

`Promise`\<`number`\>
