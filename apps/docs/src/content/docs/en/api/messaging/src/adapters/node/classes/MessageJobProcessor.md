---
editUrl: false
next: false
prev: false
title: "MessageJobProcessor"
---

Defined in: [packages/messaging/src/queue/job.processor.ts:350](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L350)

Specific processor for message jobs

## Extends

- [`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/)

## Constructors

### Constructor

> **new MessageJobProcessor**(`provider`, `options?`, `jobQueue?`): `MessageJobProcessor`

Defined in: [packages/messaging/src/queue/job.processor.ts:351](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L351)

#### Parameters

##### provider

[`Provider`](/api/core/src/interfaces/provider/)

##### options?

`Partial`\<[`JobProcessorOptions`](/api/messaging/src/adapters/node/interfaces/jobprocessoroptions/)\> = `{}`

##### jobQueue?

[`JobQueue`](/api/messaging/src/adapters/node/interfaces/jobqueue/)\<`any`\>

#### Returns

`MessageJobProcessor`

#### Overrides

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`constructor`](/api/messaging/src/adapters/node/classes/jobprocessor/#constructor)

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

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`add`](/api/messaging/src/adapters/node/classes/jobprocessor/#add)

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

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`addListener`](/api/messaging/src/adapters/node/classes/jobprocessor/#addlistener)

***

### cleanup()

> **cleanup**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:191](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L191)

Remove completed jobs from queue

#### Returns

`Promise`\<`number`\>

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`cleanup`](/api/messaging/src/adapters/node/classes/jobprocessor/#cleanup)

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

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`emit`](/api/messaging/src/adapters/node/classes/jobprocessor/#emit)

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

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`getJob`](/api/messaging/src/adapters/node/classes/jobprocessor/#getjob)

***

### getMetrics()

> **getMetrics**(): [`JobProcessorMetrics`](/api/messaging/src/adapters/node/interfaces/jobprocessormetrics/)

Defined in: [packages/messaging/src/queue/job.processor.ts:165](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L165)

Get current metrics

#### Returns

[`JobProcessorMetrics`](/api/messaging/src/adapters/node/interfaces/jobprocessormetrics/)

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`getMetrics`](/api/messaging/src/adapters/node/classes/jobprocessor/#getmetrics)

***

### getQueueStatus()

> **getQueueStatus**(): `Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

Defined in: [packages/messaging/src/queue/job.processor.ts:172](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L172)

Get queue status

#### Returns

`Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`getQueueStatus`](/api/messaging/src/adapters/node/classes/jobprocessor/#getqueuestatus)

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

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`handle`](/api/messaging/src/adapters/node/classes/jobprocessor/#handle)

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

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`off`](/api/messaging/src/adapters/node/classes/jobprocessor/#off)

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

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`on`](/api/messaging/src/adapters/node/classes/jobprocessor/#on)

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

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`once`](/api/messaging/src/adapters/node/classes/jobprocessor/#once)

***

### queueBulkMessages()

> **queueBulkMessages**(`messageRequests`, `options?`): `Promise`\<`string`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:589](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L589)

Add bulk messages to the processing queue

#### Parameters

##### messageRequests

[`MessageRequest`](/api/messaging/src/interfaces/messagerequest/)[]

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

Defined in: [packages/messaging/src/queue/job.processor.ts:561](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L561)

Add a message to the processing queue

#### Parameters

##### messageRequest

[`MessageRequest`](/api/messaging/src/interfaces/messagerequest/)

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

Defined in: [packages/messaging/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/shared/event-emitter.ts#L57)

#### Parameters

##### eventName?

`string`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`removeAllListeners`](/api/messaging/src/adapters/node/classes/jobprocessor/#removealllisteners)

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

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`removeJob`](/api/messaging/src/adapters/node/classes/jobprocessor/#removejob)

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

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`removeListener`](/api/messaging/src/adapters/node/classes/jobprocessor/#removelistener)

***

### scheduleMessage()

> **scheduleMessage**(`messageRequest`, `scheduledAt`, `options?`): `Promise`\<`string`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:607](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L607)

Schedule a message for future delivery

#### Parameters

##### messageRequest

[`MessageRequest`](/api/messaging/src/interfaces/messagerequest/)

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

Defined in: [packages/messaging/src/queue/job.processor.ts:133](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L133)

Start processing jobs

#### Returns

`void`

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`start`](/api/messaging/src/adapters/node/classes/jobprocessor/#start)

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:146](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/job.processor.ts#L146)

Stop processing jobs

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`JobProcessor`](/api/messaging/src/adapters/node/classes/jobprocessor/).[`stop`](/api/messaging/src/adapters/node/classes/jobprocessor/#stop)
