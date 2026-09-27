---
editUrl: false
next: false
prev: false
title: "DispatchJob"
---

Defined in: [packages/webhook/src/dispatcher/types.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L32)

## Properties

### attempts

> **attempts**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L39)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L37)

***

### endpoint

> **endpoint**: `object`

Defined in: [packages/webhook/src/dispatcher/types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L35)

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

#### secretUndecryptable?

> `optional` **secretUndecryptable?**: `true`

#### status

> **status**: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`

#### updatedAt

> **updatedAt**: `Date`

#### url

> **url**: `string`

***

### event

> **event**: [`WebhookEvent`](/en/api/webhook/src/type-aliases/webhookevent/)

Defined in: [packages/webhook/src/dispatcher/types.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L34)

***

### id

> **id**: `string`

Defined in: [packages/webhook/src/dispatcher/types.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L33)

***

### maxAttempts

> **maxAttempts**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L40)

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L41)

***

### priority

> **priority**: `number`

Defined in: [packages/webhook/src/dispatcher/types.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L36)

***

### scheduledAt

> **scheduledAt**: `Date`

Defined in: [packages/webhook/src/dispatcher/types.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/dispatcher/types.ts#L38)
