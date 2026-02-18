---
editUrl: false
next: false
prev: false
title: "TrackingRecord"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L15)

## Properties

### attemptCount

> **attemptCount**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L35)

***

### deliveredAt?

> `optional` **deliveredAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L32)

***

### failedAt?

> `optional` **failedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L33)

***

### from?

> `optional` **from**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L25)

***

### lastCheckedAt?

> `optional` **lastCheckedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L36)

***

### lastError?

> `optional` **lastError**: [`TrackingError`](/api/messaging/src/tracking/interfaces/trackingerror/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L38)

***

### messageId

> **messageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L16)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L40)

***

### nextCheckAt

> **nextCheckAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L37)

***

### providerId

> **providerId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L17)

***

### providerMessageId

> **providerMessageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L22)

Provider-assigned message id used to query status APIs.
When missing, store implementations may persist an empty string and the tracker will stop polling.

***

### providerStatusCode?

> `optional` **providerStatusCode**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L29)

***

### providerStatusMessage?

> `optional` **providerStatusMessage**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L30)

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L39)

***

### requestedAt

> **requestedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L26)

***

### scheduledAt?

> `optional` **scheduledAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L27)

***

### sentAt?

> `optional` **sentAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L31)

***

### status

> **status**: [`DeliveryStatus`](/api/core/src/type-aliases/deliverystatus/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L28)

***

### statusUpdatedAt

> **statusUpdatedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L34)

***

### to

> **to**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L24)

***

### type

> **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L23)
