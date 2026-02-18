---
editUrl: false
next: false
prev: false
title: "RetryHandlerOptions"
---

Defined in: [packages/messaging/src/queue/retry.handler.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L51)

## Properties

### checkInterval

> **checkInterval**: `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L53)

***

### enablePersistence

> **enablePersistence**: `boolean`

Defined in: [packages/messaging/src/queue/retry.handler.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L55)

***

### maxQueueSize

> **maxQueueSize**: `number`

Defined in: [packages/messaging/src/queue/retry.handler.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L54)

***

### onRetryExhausted()?

> `optional` **onRetryExhausted**: (`item`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L56)

#### Parameters

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

#### Returns

`Promise`\<`void`\>

***

### onRetryFailed()?

> `optional` **onRetryFailed**: (`item`, `error`) => `Promise`\<`void`\>

Defined in: [packages/messaging/src/queue/retry.handler.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L58)

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

Defined in: [packages/messaging/src/queue/retry.handler.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L57)

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

Defined in: [packages/messaging/src/queue/retry.handler.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L52)
