---
editUrl: false
next: false
prev: false
title: "MessageRetryHandler"
---

Defined in: [packages/messaging/src/queue/retry.handler.ts:71](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L71)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new MessageRetryHandler**(`options`): `MessageRetryHandler`

Defined in: [packages/messaging/src/queue/retry.handler.ts:93](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L93)

#### Parameters

##### options

[`RetryHandlerOptions`](/api/messaging/src/adapters/node/interfaces/retryhandleroptions/)

#### Returns

`MessageRetryHandler`

#### Overrides

`EventEmitter.constructor`

## Methods

### addForRetry()

> **addForRetry**(`deliveryReport`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:143](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L143)

Add a failed delivery for retry

#### Parameters

##### deliveryReport

[`DeliveryReport`](/api/messaging/src/interfaces/deliveryreport/)

#### Returns

`Promise`\<`boolean`\>

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

### cancelRetry()

> **cancelRetry**(`messageId`): `boolean`

Defined in: [packages/messaging/src/queue/retry.handler.ts:188](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L188)

Cancel retry for a specific message

#### Parameters

##### messageId

`string`

#### Returns

`boolean`

***

### cleanup()

> **cleanup**(): `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:224](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L224)

Clean up completed/exhausted retry items

#### Returns

`number`

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

### getMetrics()

> **getMetrics**(): [`RetryHandlerMetrics`](/api/messaging/src/adapters/node/interfaces/retryhandlermetrics/)

Defined in: [packages/messaging/src/queue/retry.handler.ts:217](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L217)

Get metrics

#### Returns

[`RetryHandlerMetrics`](/api/messaging/src/adapters/node/interfaces/retryhandlermetrics/)

***

### getRetryQueue()

> **getRetryQueue**(): [`RetryQueueItem`](/api/messaging/src/adapters/node/interfaces/retryqueueitem/)[]

Defined in: [packages/messaging/src/queue/retry.handler.ts:210](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L210)

Get all retry queue items

#### Returns

[`RetryQueueItem`](/api/messaging/src/adapters/node/interfaces/retryqueueitem/)[]

***

### getRetryStatus()

> **getRetryStatus**(`messageId`): [`RetryQueueItem`](/api/messaging/src/adapters/node/interfaces/retryqueueitem/) \| `undefined`

Defined in: [packages/messaging/src/queue/retry.handler.ts:203](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L203)

Get retry status for a message

#### Parameters

##### messageId

`string`

#### Returns

[`RetryQueueItem`](/api/messaging/src/adapters/node/interfaces/retryqueueitem/) \| `undefined`

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

Defined in: [packages/messaging/src/queue/retry.handler.ts:111](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L111)

Start the retry handler

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:124](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/queue/retry.handler.ts#L124)

Stop the retry handler

#### Returns

`Promise`\<`void`\>
