---
editUrl: false
next: false
prev: false
title: "RetryHandlerOptions"
---

Defined in: [packages/messaging/src/queue/retry.handler.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L55)

## Properties

### checkInterval

> **checkInterval**: `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L57)

***

### enablePersistence

> **enablePersistence**: `boolean`

Defined in: [packages/messaging/src/queue/retry.handler.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L59)

***

### execute()

> **execute**: (`attempt`, `item`) => `Promise`\<`unknown`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L60)

#### Parameters

##### attempt

[`RetryAttempt`](/api/k-msg/src/adapters/node/interfaces/retryattempt/)

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

#### Returns

`Promise`\<`unknown`\>

***

### maxQueueSize

> **maxQueueSize**: `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L58)

***

### onRetryExhausted()?

> `optional` **onRetryExhausted**: (`item`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L66)

#### Parameters

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

#### Returns

`Promise`\<`void`\>

***

### onRetryFailed()?

> `optional` **onRetryFailed**: (`item`, `error`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L68)

#### Parameters

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

##### error

`Error`

#### Returns

`Promise`\<`void`\>

***

### onRetrySuccess()?

> `optional` **onRetrySuccess**: (`item`, `result`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L67)

#### Parameters

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

##### result

`unknown`

#### Returns

`Promise`\<`void`\>

***

### policy

> **policy**: [`RetryPolicy`](/api/k-msg/src/adapters/node/interfaces/retrypolicy/)

Defined in: [packages/messaging/src/queue/retry.handler.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L56)

***

### shouldRetryError()?

> `optional` **shouldRetryError**: (`error`, `item`, `attempt`) => `boolean`

Defined in: [packages/messaging/src/queue/retry.handler.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L61)

#### Parameters

##### error

`Error`

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

##### attempt

[`RetryAttempt`](/api/k-msg/src/adapters/node/interfaces/retryattempt/)

#### Returns

`boolean`
