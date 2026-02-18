---
editUrl: false
next: false
prev: false
title: "CloudflareObjectJobQueue"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:22](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L22)

## Type Parameters

### T

`T`

## Implements

- [`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/)\<`T`\>

## Constructors

### Constructor

> **new CloudflareObjectJobQueue**\<`T`\>(`storage`, `keyPrefix?`): `CloudflareObjectJobQueue`\<`T`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:23](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L23)

#### Parameters

##### storage

[`CloudflareObjectStorage`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflareobjectstorage/)

##### keyPrefix?

`string` = `"kmsg/jobs"`

#### Returns

`CloudflareObjectJobQueue`\<`T`\>

## Methods

### clear()

> **clear**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:180](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L180)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`clear`](/api/messaging/src/adapters/node/interfaces/jobqueue/#clear)

***

### complete()

> **complete**(`jobId`, `_result?`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:87](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L87)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:60](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L60)

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`dequeue`](/api/messaging/src/adapters/node/interfaces/jobqueue/#dequeue)

***

### enqueue()

> **enqueue**(`type`, `data`, `options?`): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\>\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:28](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L28)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:103](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L103)

#### Parameters

##### jobId

`string`

##### error

`string` | `Error`

##### shouldRetry?

`boolean` = `false`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`fail`](/api/messaging/src/adapters/node/interfaces/jobqueue/#fail)

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:167](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L167)

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`getJob`](/api/messaging/src/adapters/node/interfaces/jobqueue/#getjob)

***

### peek()

> **peek**(): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:142](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L142)

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`T`\> \| `undefined`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`peek`](/api/messaging/src/adapters/node/interfaces/jobqueue/#peek)

***

### remove()

> **remove**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:173](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L173)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-job-queue.ts:157](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/adapters/cloudflare/object-job-queue.ts#L157)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/).[`size`](/api/messaging/src/adapters/node/interfaces/jobqueue/#size)
