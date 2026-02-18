---
editUrl: false
next: false
prev: false
title: "MessageJobProcessor"
---

Defined in: packages/messaging/dist/queue/job.processor.d.ts:103

Specific processor for message jobs

## Extends

- [`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/)

## Constructors

### Constructor

> **new MessageJobProcessor**(`provider`, `options?`, `jobQueue?`): `MessageJobProcessor`

Defined in: packages/messaging/dist/queue/job.processor.d.ts:105

#### Parameters

##### provider

[`Provider`](/api/core/src/interfaces/provider/)

##### options?

`Partial`\<[`JobProcessorOptions`](/api/k-msg/src/adapters/node/interfaces/jobprocessoroptions/)\>

##### jobQueue?

[`JobQueue`](/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`any`\>

#### Returns

`MessageJobProcessor`

#### Overrides

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`constructor`](/api/k-msg/src/adapters/node/classes/jobprocessor/#constructor)

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

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`add`](/api/k-msg/src/adapters/node/classes/jobprocessor/#add)

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`addListener`](/api/k-msg/src/adapters/node/classes/jobprocessor/#addlistener)

***

### cleanup()

> **cleanup**(): `Promise`\<`number`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:83

Remove completed jobs from queue

#### Returns

`Promise`\<`number`\>

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`cleanup`](/api/k-msg/src/adapters/node/classes/jobprocessor/#cleanup)

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`emit`](/api/k-msg/src/adapters/node/classes/jobprocessor/#emit)

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

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`getJob`](/api/k-msg/src/adapters/node/classes/jobprocessor/#getjob)

***

### getMetrics()

> **getMetrics**(): [`JobProcessorMetrics`](/api/k-msg/src/adapters/node/interfaces/jobprocessormetrics/)

Defined in: packages/messaging/dist/queue/job.processor.d.ts:70

Get current metrics

#### Returns

[`JobProcessorMetrics`](/api/k-msg/src/adapters/node/interfaces/jobprocessormetrics/)

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`getMetrics`](/api/k-msg/src/adapters/node/classes/jobprocessor/#getmetrics)

***

### getQueueStatus()

> **getQueueStatus**(): `Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:74

Get queue status

#### Returns

`Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`getQueueStatus`](/api/k-msg/src/adapters/node/classes/jobprocessor/#getqueuestatus)

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

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`handle`](/api/k-msg/src/adapters/node/classes/jobprocessor/#handle)

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`off`](/api/k-msg/src/adapters/node/classes/jobprocessor/#off)

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`on`](/api/k-msg/src/adapters/node/classes/jobprocessor/#on)

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`once`](/api/k-msg/src/adapters/node/classes/jobprocessor/#once)

***

### queueBulkMessages()

> **queueBulkMessages**(`messageRequests`, `options?`): `Promise`\<`string`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:122

Add bulk messages to the processing queue

#### Parameters

##### messageRequests

`MessageRequest`[]

##### options?

###### delay?

`number`

###### metadata?

`Record`\<`string`, `any`\>

###### priority?

`number`

#### Returns

`Promise`\<`string`\>

***

### queueMessage()

> **queueMessage**(`messageRequest`, `options?`): `Promise`\<`string`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:114

Add a message to the processing queue

#### Parameters

##### messageRequest

`MessageRequest`

##### options?

###### delay?

`number`

###### metadata?

`Record`\<`string`, `any`\>

###### priority?

`number`

#### Returns

`Promise`\<`string`\>

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`removeAllListeners`](/api/k-msg/src/adapters/node/classes/jobprocessor/#removealllisteners)

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

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`removeJob`](/api/k-msg/src/adapters/node/classes/jobprocessor/#removejob)

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

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`removeListener`](/api/k-msg/src/adapters/node/classes/jobprocessor/#removelistener)

***

### scheduleMessage()

> **scheduleMessage**(`messageRequest`, `scheduledAt`, `options?`): `Promise`\<`string`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:130

Schedule a message for future delivery

#### Parameters

##### messageRequest

`MessageRequest`

##### scheduledAt

`Date`

##### options?

###### metadata?

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<`string`\>

***

### start()

> **start**(): `void`

Defined in: packages/messaging/dist/queue/job.processor.d.ts:62

Start processing jobs

#### Returns

`void`

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`start`](/api/k-msg/src/adapters/node/classes/jobprocessor/#start)

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/job.processor.d.ts:66

Stop processing jobs

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`JobProcessor`](/api/k-msg/src/adapters/node/classes/jobprocessor/).[`stop`](/api/k-msg/src/adapters/node/classes/jobprocessor/#stop)
