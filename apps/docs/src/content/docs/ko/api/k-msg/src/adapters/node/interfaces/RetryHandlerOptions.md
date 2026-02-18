---
editUrl: false
next: false
prev: false
title: "RetryHandlerOptions"
---

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:36

## Properties

### checkInterval

> **checkInterval**: `number`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:38

***

### enablePersistence

> **enablePersistence**: `boolean`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:40

***

### maxQueueSize

> **maxQueueSize**: `number`

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:39

***

### onRetryExhausted()?

> `optional` **onRetryExhausted**: (`item`) => `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:41

#### Parameters

##### item

[`RetryQueueItem`](/api/k-msg/src/adapters/node/interfaces/retryqueueitem/)

#### Returns

`Promise`\<`void`\>

***

### onRetryFailed()?

> `optional` **onRetryFailed**: (`item`, `error`) => `Promise`\<`void`\>

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:43

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

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:42

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

Defined in: packages/messaging/dist/queue/retry.handler.d.ts:37
