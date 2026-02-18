---
editUrl: false
next: false
prev: false
title: "WebhookDelivery"
---

Defined in: [packages/webhook/src/types/webhook.types.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L105)

## Properties

### attempts

> **attempts**: [`WebhookAttempt`](/api/webhook/src/interfaces/webhookattempt/)[]

Defined in: [packages/webhook/src/types/webhook.types.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L118)

***

### completedAt?

> `optional` **completedAt**: `Date`

Defined in: [packages/webhook/src/types/webhook.types.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L121)

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/webhook/src/types/webhook.types.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L120)

***

### endpointId

> **endpointId**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L107)

***

### eventId

> **eventId**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L108)

***

### eventType?

> `optional` **eventType**: [`WebhookEventType`](/api/webhook/src/enumerations/webhookeventtype/)

Defined in: [packages/webhook/src/types/webhook.types.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L113)

Optional event type for filtering/stats.
(Helpful because `payload` is a JSON string and timestamps need revival when parsed.)

***

### headers

> **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/webhook/src/types/webhook.types.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L116)

***

### httpMethod

> **httpMethod**: `"POST"` \| `"PUT"` \| `"PATCH"`

Defined in: [packages/webhook/src/types/webhook.types.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L115)

***

### id

> **id**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:106](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L106)

***

### nextRetryAt?

> `optional` **nextRetryAt**: `Date`

Defined in: [packages/webhook/src/types/webhook.types.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L122)

***

### payload

> **payload**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L117)

***

### status

> **status**: `"failed"` \| `"success"` \| `"pending"` \| `"exhausted"`

Defined in: [packages/webhook/src/types/webhook.types.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L119)

***

### url

> **url**: `string`

Defined in: [packages/webhook/src/types/webhook.types.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/webhook/src/types/webhook.types.ts#L114)
