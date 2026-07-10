---
editUrl: false
next: false
prev: false
title: "DispatchJob"
---

Defined in: [packages/webhook/src/dispatcher/types.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L40)

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L47)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L45)

***

### endpoint

> **endpoint**: `object`

Defined in: [packages/webhook/src/dispatcher/types.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L43)

#### active

> **active**: `boolean`

#### createdAt

> **createdAt**: `Date`

#### description?

> `optional` **description?**: `string`

#### events

> **events**: [`WebhookEventType`](/en/api/webhook/src/enumerations/webhookeventtype/)[]

#### filters?

> `optional` **filters?**: `object`

##### filters.channelId?

> `optional` **channelId?**: `string`[]

##### filters.providerId?

> `optional` **providerId?**: `string`[]

##### filters.templateId?

> `optional` **templateId?**: `string`[]

#### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

#### id

> **id**: `string`

#### lastTriggeredAt?

> `optional` **lastTriggeredAt?**: `Date`

#### name?

> `optional` **name?**: `string`

#### retryConfig?

> `optional` **retryConfig?**: `object`

##### retryConfig.backoffMultiplier

> **backoffMultiplier**: `number`

##### retryConfig.maxRetries

> **maxRetries**: `number`

##### retryConfig.retryDelayMs

> **retryDelayMs**: `number`

#### secret?

> `optional` **secret?**: `string`

#### status

> **status**: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`

#### updatedAt

> **updatedAt**: `Date`

#### url

> **url**: `string`

***

### event

> **event**: [`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

Defined in: [packages/webhook/src/dispatcher/types.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L42)

***

### id

> **id**: `string`

Defined in: [packages/webhook/src/dispatcher/types.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L41)

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L48)

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L49)

***

### priority

> **priority**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L44)

***

### scheduledAt

> **scheduledAt**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L46)
