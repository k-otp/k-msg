---
editUrl: false
next: false
prev: false
title: "WebhookEndpoint"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L80)

## Properties

### active

> **active**: `boolean`

Defined in: [packages/webhook/src/types/webhook.types.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L85)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/webhook/src/types/webhook.types.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L99)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L84)

***

### events

> **events**: [`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)[]

Defined in: [packages/webhook/src/types/webhook.types.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L86)

***

### filters?

> `optional` **filters**: `object`

Defined in: [packages/webhook/src/types/webhook.types.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L94)

#### channelId?

> `optional` **channelId**: `string`[]

#### providerId?

> `optional` **providerId**: `string`[]

#### templateId?

> `optional` **templateId**: `string`[]

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L87)

***

### id

> **id**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L81)

***

### lastTriggeredAt?

> `optional` **lastTriggeredAt**: `Date`

Defined in: [packages/webhook/src/types/webhook.types.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L101)

***

### name?

> `optional` **name**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L83)

***

### retryConfig?

> `optional` **retryConfig**: `object`

Defined in: [packages/webhook/src/types/webhook.types.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L89)

#### backoffMultiplier

> **backoffMultiplier**: `number`

#### maxRetries

> **maxRetries**: `number`

#### retryDelayMs

> **retryDelayMs**: `number`

***

### secret?

> `optional` **secret**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L88)

***

### status

> **status**: `"error"` \| `"active"` \| `"inactive"` \| `"suspended"`

Defined in: [packages/webhook/src/types/webhook.types.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L102)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/webhook/src/types/webhook.types.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L100)

***

### url

> **url**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L82)
