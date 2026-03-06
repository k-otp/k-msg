---
editUrl: false
next: false
prev: false
title: "MessageJobProcessor"
---

Defined in: [packages/messaging/src/queue/job.processor.ts:358](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L358)

Specific processor for message jobs

## Extends

- [`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/)

## Constructors

### Constructor

> **new MessageJobProcessor**(`provider`, `options?`, `jobQueue?`): `MessageJobProcessor`

Defined in: [packages/messaging/src/queue/job.processor.ts:359](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L359)

#### Parameters

##### provider

[`Provider`](/en/api/core/src/interfaces/provider/)

##### options?

`Partial`\<[`JobProcessorOptions`](/en/api/k-msg/src/adapters/node/interfaces/jobprocessoroptions/)\> = `{}`

##### jobQueue?

[`JobQueue`](/en/api/k-msg/src/adapters/node/interfaces/jobqueue/)\<`any`\>

#### Returns

`MessageJobProcessor`

#### Overrides

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`constructor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#constructor)

## Methods

### add()

> **add**\<`T`\>(`jobType`, `data`, `options?`): `Promise`\<`string`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L108)

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

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`add`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#add)

***

### addListener()

> **addListener**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L16)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`addListener`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#addlistener)

***

### cleanup()

> **cleanup**(): `Promise`\<`number`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:192](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L192)

Remove terminal jobs from queue without touching pending or processing jobs.

#### Returns

`Promise`\<`number`\>

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`cleanup`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#cleanup)

***

### emit()

> **emit**(`eventName`, ...`args`): `boolean`

Defined in: [packages/messaging/src/shared/event-emitter.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L44)

#### Parameters

##### eventName

`string`

##### args

...`unknown`[]

#### Returns

`boolean`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`emit`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#emit)

***

### getJob()

> **getJob**(`jobId`): `Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`any`\> \| `undefined`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:208](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L208)

Get specific job by ID

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<[`Job`](/en/api/k-msg/src/adapters/node/interfaces/job/)\<`any`\> \| `undefined`\>

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`getJob`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#getjob)

***

### getMetrics()

> **getMetrics**(): [`JobProcessorMetrics`](/en/api/k-msg/src/adapters/node/interfaces/jobprocessormetrics/)

Defined in: [packages/messaging/src/queue/job.processor.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L166)

Get current metrics

#### Returns

[`JobProcessorMetrics`](/en/api/k-msg/src/adapters/node/interfaces/jobprocessormetrics/)

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`getMetrics`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#getmetrics)

***

### getQueueStatus()

> **getQueueStatus**(): `Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

Defined in: [packages/messaging/src/queue/job.processor.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L173)

Get queue status

#### Returns

`Promise`\<\{ `failed`: `number`; `pending`: `number`; `processing`: `number`; `totalProcessed`: `number`; \}\>

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`getQueueStatus`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#getqueuestatus)

***

### handle()

> **handle**\<`T`\>(`jobType`, `handler`): `void`

Defined in: [packages/messaging/src/queue/job.processor.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L101)

Register a job handler

#### Type Parameters

##### T

`T`

#### Parameters

##### jobType

`string`

##### handler

[`JobHandler`](/en/api/k-msg/src/adapters/node/type-aliases/jobhandler/)\<`T`\>

#### Returns

`void`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`handle`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#handle)

***

### off()

> **off**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L20)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`off`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#off)

***

### on()

> **on**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L9)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`on`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#on)

***

### once()

> **once**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L35)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`once`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#once)

***

### queueBulkMessages()

> **queueBulkMessages**(`messageRequests`, `options?`): `Promise`\<`string`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:638](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L638)

Add bulk messages to the processing queue

#### Parameters

##### messageRequests

[`MessageRequest`](/en/api/messaging/src/interfaces/messagerequest/)[]

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

Defined in: [packages/messaging/src/queue/job.processor.ts:610](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L610)

Add a message to the processing queue

#### Parameters

##### messageRequest

[`MessageRequest`](/en/api/messaging/src/interfaces/messagerequest/)

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

Defined in: [packages/messaging/src/shared/event-emitter.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L57)

#### Parameters

##### eventName?

`string`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`removeAllListeners`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#removealllisteners)

***

### removeJob()

> **removeJob**(`jobId`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L215)

Remove job from queue

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`removeJob`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#removejob)

***

### removeListener()

> **removeListener**(`eventName`, `listener`): `this`

Defined in: [packages/messaging/src/shared/event-emitter.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/shared/event-emitter.ts#L31)

#### Parameters

##### eventName

`string`

##### listener

`Listener`

#### Returns

`this`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`removeListener`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#removelistener)

***

### scheduleMessage()

> **scheduleMessage**(`messageRequest`, `scheduledAt`, `options?`): `Promise`\<`string`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:656](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L656)

Schedule a message for future delivery

#### Parameters

##### messageRequest

[`MessageRequest`](/en/api/messaging/src/interfaces/messagerequest/)

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

Defined in: [packages/messaging/src/queue/job.processor.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L134)

Start processing jobs

#### Returns

`void`

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`start`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#start)

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/job.processor.ts:147](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/job.processor.ts#L147)

Stop processing jobs

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`JobProcessor`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/).[`stop`](/en/api/k-msg/src/adapters/node/classes/jobprocessor/#stop)
