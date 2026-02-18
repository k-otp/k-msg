---
editUrl: false
next: false
prev: false
title: "JobProcessor"
---

Defined in: packages/messaging/dist/queue/job.processor.d.ts:35

## Extends

- `EventEmitter`

## Extended by

- [`MessageJobProcessor`](/api/k-msg/src/adapters/node/classes/messagejobprocessor/)

## Constructors

### Constructor

> **new JobProcessor**(`options`, `jobQueue?`): `JobProcessor`

Defined in: packages/messaging/dist/queue/job.processor.d.ts:45

#### Parameters

##### options

[`JobProcessorOptions`](/api/k-msg/src/adapters/node/interfaces/jobprocessoroptions/)

##### jobQueue?

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`any`\>

#### Returns

`JobProcessor`

#### Overrides

`EventEmitter.constructor`

## Methods

### add()

> **add**\<`T`\>(`jobType`, `data`, `options?`): `Promise`\<`string`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:53

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:8

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

Defined in: packages/messaging/dist/queue/job.processor.d.ts:83

Remove completed jobs from queue

#### Returns

`Promise`\<`number`\>

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:12

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

> **getJob**(`jobId`): `Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`any`\> \| `undefined`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:87

Get specific job by ID

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/api/k-msg/src/adapters/node/interfaces/job/)\<`any`\> \| `undefined`\>

***

### getMetrics()

> **getMetrics**(): [`JobProcessorMetrics`](/api/k-msg/src/adapters/node/interfaces/jobprocessormetrics/)

Defined in: packages/messaging/dist/queue/job.processor.d.ts:70

Get current metrics

#### Returns

[`JobProcessorMetrics`](/api/k-msg/src/adapters/node/interfaces/jobprocessormetrics/)

***

### getQueueStatus()

> **getQueueStatus**(): `Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:74

Get queue status

#### Returns

`Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

***

### handle()

> **handle**\<`T`\>(`jobType`, `handler`): `void`

Defined in: packages/messaging/dist/queue/job.processor.d.ts:49

Register a job handler

#### Type Parameters

##### T

`T`

#### Parameters

##### jobType

`string`

##### handler

[`JobHandler`](/api/k-msg/src/adapters/node/type-aliases/jobhandler/)\<`T`\>

#### Returns

`void`

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:9

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:7

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:11

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

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:13

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

Defined in: packages/messaging/dist/queue/job.processor.d.ts:91

Remove job from queue

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### removeListener()

> **removeListener**(`eventName`, `listener`): `this`

Defined in: packages/messaging/dist/shared/event-emitter.d.ts:10

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

Defined in: packages/messaging/dist/queue/job.processor.d.ts:62

Start processing jobs

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:66

Stop processing jobs

#### Returns

`Promise`\<`void`\>
