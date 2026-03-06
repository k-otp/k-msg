---
editUrl: false
next: false
prev: false
title: "RetryHandlerOptions"
---

Defined in: [packages/messaging/src/queue/retry.handler.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L50)

## Properties

### checkInterval

> **checkInterval**: `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L52)

***

### execute()

> **execute**: (`attempt`, `item`) => `Promise`\<`unknown`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L54)

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

Defined in: [packages/messaging/src/queue/retry.handler.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L53)

***

### onRetryExhausted()?

> `optional` **onRetryExhausted**: (`item`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L60)

#### Parameters

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

#### Returns

`Promise`\<`void`\>

***

### onRetryFailed()?

> `optional` **onRetryFailed**: (`item`, `error`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L62)

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

Defined in: [packages/messaging/src/queue/retry.handler.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L61)

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

Defined in: [packages/messaging/src/queue/retry.handler.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L51)

***

### shouldRetryError()?

> `optional` **shouldRetryError**: (`error`, `item`, `attempt`) => `boolean`

Defined in: [packages/messaging/src/queue/retry.handler.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L55)

#### Parameters

##### error

`Error`

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

##### attempt

[`RetryAttempt`](/api/k-msg/src/adapters/node/interfaces/retryattempt/)

#### Returns

`boolean`
