---
editUrl: false
next: false
prev: false
title: "JobProcessor"
---

Defined in: [packages/messaging/src/queue/job.processor.ts:53](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L53)

## Extends

- `EventEmitter`

## Extended by

- [`MessageJobProcessor`](/api/messaging/src/adapters/node/classes/messagejobprocessor/)

## Constructors

### Constructor

> **new JobProcessor**(`options`, `jobQueue?`): `JobProcessor`

Defined in: [packages/messaging/src/queue/job.processor.ts:63](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L63)

#### Parameters

##### options

[`JobProcessorOptions`](/api/messaging/src/adapters/node/interfaces/jobprocessoroptions/)

##### jobQueue?

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/)\<`any`\>

#### Returns

`JobProcessor`

#### Overrides

`EventEmitter.constructor`

## Methods

### add()

> **add**\<`T`\>(`jobType`, `data`, `options?`): `Promise`\<`string`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:107](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L107)

Add a job to the queue

#### Type Parameters

##### T

`T`

#### Parameters

##### jobType

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

`Promise`\<`string`\>

***

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L16)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.addListener`

***

### cleanup()

> **cleanup**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:191](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L191)

Remove completed jobs from queue

#### Returns

`Promise`\<`number`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/messaging/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L44)

#### Parameters

##### eventName

`string`

##### args

...`unknown`[]

#### Returns

`boolean`

#### Inherited from

`EventEmitter.emit`

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`any`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:202](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L202)

Get specific job by ID

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/messaging/src/adapters/node/interfaces/job/)\<`any`\> \| `undefined`\>

***

### getMetrics()

> **getMetrics**(): [`JobProcessorMetrics`](/api/messaging/src/adapters/node/interfaces/jobprocessormetrics/)

Defined in: [packages/messaging/src/queue/job.processor.ts:165](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L165)

Get current metrics

#### Returns

[`JobProcessorMetrics`](/api/messaging/src/adapters/node/interfaces/jobprocessormetrics/)

***

### getQueueStatus()

> **getQueueStatus**(): `Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

Defined in: [packages/messaging/src/queue/job.processor.ts:172](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L172)

Get queue status

#### Returns

`Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

***

### handle()

> **handle**\<`T`\>(`jobType`, `handler`): `void`

Defined in: [packages/messaging/src/queue/job.processor.ts:100](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L100)

Register a job handler

#### Type Parameters

##### T

`T`

#### Parameters

##### jobType

`string`

##### handler

[`JobHandler`](/api/messaging/src/adapters/node/type-aliases/jobhandler/)\<`T`\>

#### Returns

`void`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L20)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.off`

***

### on()

> **on**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L9)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.on`

***

### once()

> **once**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L35)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.once`

***

### removeAllListeners()

> **removeAllListeners**(`eventName?`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L57)

#### Parameters

##### eventName?

`string`

#### Returns

`this`

#### Inherited from

`EventEmitter.removeAllListeners`

***

### removeJob()

> **removeJob**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:209](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L209)

Remove job from queue

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### removeListener()

> **removeListener**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L31)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

`EventEmitter.removeListener`

***

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/queue/job.processor.ts:133](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L133)

Start processing jobs

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:146](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L146)

Stop processing jobs

#### Returns

`Promise`\<`void`\>
