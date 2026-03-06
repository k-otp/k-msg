---
editUrl: false
next: false
prev: false
title: "RetryQueueItem"
---

Defined in: [packages/messaging/src/queue/retry.handler.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L38)

## Properties

### attempts

> **attempts**: [`RetryAttempt`](/api/k-msg/src/adapters/node/interfaces/retryattempt/)[]

Defined in: [packages/messaging/src/queue/retry.handler.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L43)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/messaging/src/queue/retry.handler.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L46)

***

### id

> **id**: `string`

Defined in: [packages/messaging/src/queue/retry.handler.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L39)

***

### messageId

> **messageId**: `string`

Defined in: [packages/messaging/src/queue/retry.handler.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L40)

***

### nextRetryAt

> **nextRetryAt**: `Date`

Defined in: [packages/messaging/src/queue/retry.handler.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L44)

***

### originalDeliveryReport

> **originalDeliveryReport**: [`DeliveryReport`](/api/messaging/src/interfaces/deliveryreport/)

Defined in: [packages/messaging/src/queue/retry.handler.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L42)

***

### phoneNumber

> **phoneNumber**: `string`

Defined in: [packages/messaging/src/queue/retry.handler.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L41)

***

### status

> **status**: `"pending"` \| `"processing"` \| `"succeeded"` \| `"exhausted"` \| `"cancelled"`

Defined in: [packages/messaging/src/queue/retry.handler.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L45)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/messaging/src/queue/retry.handler.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/queue/retry.handler.ts#L47)
