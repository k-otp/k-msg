---
editUrl: false
next: false
prev: false
title: "MessageRetryHandler"
---

Defined in: [packages/messaging/src/queue/retry.handler.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L75)

## Extends

- `EventEmitter`

## Constructors

### Constructor

> **new MessageRetryHandler**(`options`): `MessageRetryHandler`

Defined in: [packages/messaging/src/queue/retry.handler.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L97)

#### Parameters

##### options

[`RetryHandlerOptions`](/en/api/k-msg/src/adapters/node/interfaces/retryhandleroptions/)

#### Returns

`MessageRetryHandler`

#### Overrides

`EventEmitter.constructor`

## Methods

### addForRetry()

> **addForRetry**(`deliveryReport`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:146](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L146)

Add a failed delivery for retry

#### Parameters

##### deliveryReport

[`DeliveryReport`](/en/api/messaging/src/interfaces/deliveryreport/)

#### Returns

`Promise`\<`boolean`\>

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

`EventEmitter.addListener`

***

### cancelRetry()

> **cancelRetry**(`messageId`): `boolean`

Defined in: [packages/messaging/src/queue/retry.handler.ts:186](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L186)

Cancel retry for a specific message

#### Parameters

##### messageId

`string`

#### Returns

`boolean`

***

### cleanup()

> **cleanup**(): `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:223](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L223)

Clean up terminal retry items

#### Returns

`number`

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

`EventEmitter.emit`

***

### getMetrics()

> **getMetrics**(): [`RetryHandlerMetrics`](/en/api/k-msg/src/adapters/node/interfaces/retryhandlermetrics/)

Defined in: [packages/messaging/src/queue/retry.handler.ts:216](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L216)

Get metrics

#### Returns

[`RetryHandlerMetrics`](/en/api/k-msg/src/adapters/node/interfaces/retryhandlermetrics/)

***

### getRetryQueue()

> **getRetryQueue**(): [`RetryQueueItem`](/en/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)[]

Defined in: [packages/messaging/src/queue/retry.handler.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L209)

Get all retry queue items

#### Returns

[`RetryQueueItem`](/en/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)[]

***

### getRetryStatus()

> **getRetryStatus**(`messageId`): [`RetryQueueItem`](/en/api/k-msg/src/adapters/node/interfaces/retryqueueitem/) \| `undefined`

Defined in: [packages/messaging/src/queue/retry.handler.ts:202](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L202)

Get retry status for a message

#### Parameters

##### messageId

`string`

#### Returns

[`RetryQueueItem`](/en/api/k-msg/src/adapters/node/interfaces/retryqueueitem/) \| `undefined`

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

`EventEmitter.off`

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

`EventEmitter.on`

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

`EventEmitter.once`

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

`EventEmitter.removeAllListeners`

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

`EventEmitter.removeListener`

***

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/queue/retry.handler.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L115)

Start the retry handler

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L128)

Stop the retry handler

#### Returns

`Promise`\<`void`\>
