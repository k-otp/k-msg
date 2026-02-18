---
editUrl: false
next: false
prev: false
title: "MessageRetryHandler"
---

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:54

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new MessageRetryHandler**(`options`): `MessageRetryHandler`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:62

#### Parameters

##### options

[`RetryHandlerOptions`](/api/k-msg/src/adapters/node/interfaces/retryhandleroptions/)

#### Returns

`MessageRetryHandler`

#### Overrides

`EventEmitter.constructor`

## Methods

### addForRetry()

> **addForRetry**(`deliveryReport`): `Promise`\<`boolean`\>

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:74

Add a failed delivery for retry

#### Parameters

##### deliveryReport

`DeliveryReport`

#### Returns

`Promise`\<`boolean`\>

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

### cancelRetry()

> **cancelRetry**(`messageId`): `boolean`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:78

Cancel retry for a specific message

#### Parameters

##### messageId

`string`

#### Returns

`boolean`

***

### cleanup()

> **cleanup**(): `number`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:94

Clean up completed/exhausted retry items

#### Returns

`number`

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

### getMetrics()

> **getMetrics**(): [`RetryHandlerMetrics`](/api/k-msg/src/adapters/node/interfaces/retryhandlermetrics/)

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:90

Get metrics

#### Returns

[`RetryHandlerMetrics`](/api/k-msg/src/adapters/node/interfaces/retryhandlermetrics/)

***

### getRetryQueue()

> **getRetryQueue**(): [`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)[]

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:86

Get all retry queue items

#### Returns

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)[]

***

### getRetryStatus()

> **getRetryStatus**(`messageId`): [`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/) \| `undefined`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:82

Get retry status for a message

#### Parameters

##### messageId

`string`

#### Returns

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/) \| `undefined`

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

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:66

Start the retry handler

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:70

Stop the retry handler

#### Returns

`Promise`\<`void`\>
