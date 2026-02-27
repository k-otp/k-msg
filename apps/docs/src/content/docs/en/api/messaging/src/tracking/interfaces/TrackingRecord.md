---
editUrl: false
next: false
prev: false
title: "TrackingRecord"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L18)

## Properties

### attemptCount

> **attemptCount**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L42)

***

### cryptoKid?

> `optional` **cryptoKid**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L50)

***

### cryptoState?

> `optional` **cryptoState**: `"plain"` \| `"encrypted"` \| `"degraded"`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L52)

***

### cryptoVersion?

> `optional` **cryptoVersion**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L51)

***

### deliveredAt?

> `optional` **deliveredAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L39)

***

### failedAt?

> `optional` **failedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L40)

***

### fieldModes?

> `optional` **fieldModes**: `Partial`\<`Record`\<`string`, [`FieldMode`](/api/core/src/type-aliases/fieldmode/)\>\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L55)

***

### from?

> `optional` **from**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L30)

***

### fromHash?

> `optional` **fromHash**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L31)

***

### fromMasked?

> `optional` **fromMasked**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L32)

***

### lastCheckedAt?

> `optional` **lastCheckedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L43)

***

### lastError?

> `optional` **lastError**: [`TrackingError`](/api/messaging/src/tracking/interfaces/trackingerror/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L45)

***

### messageId

> **messageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L19)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L47)

***

### metadataEncrypted?

> `optional` **metadataEncrypted**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L49)

***

### metadataHashes?

> `optional` **metadataHashes**: `Record`\<`string`, `string`\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L48)

***

### nextCheckAt

> **nextCheckAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L44)

***

### providerId

> **providerId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L20)

***

### providerMessageId

> **providerMessageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L25)

Provider-assigned message id used to query status APIs.
When missing, store implementations may persist an empty string and the tracker will stop polling.

***

### providerStatusCode?

> `optional` **providerStatusCode**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L36)

***

### providerStatusMessage?

> `optional` **providerStatusMessage**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L37)

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L46)

***

### requestedAt

> **requestedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L33)

***

### retentionBucketYm?

> `optional` **retentionBucketYm**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L54)

***

### retentionClass?

> `optional` **retentionClass**: `"opsLogs"` \| `"telecomMetadata"` \| `"billingEvidence"`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L53)

***

### scheduledAt?

> `optional` **scheduledAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L34)

***

### sentAt?

> `optional` **sentAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L38)

***

### status

> **status**: [`DeliveryStatus`](/api/core/src/type-aliases/deliverystatus/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L35)

***

### statusUpdatedAt

> **statusUpdatedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L41)

***

### to

> **to**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L27)

***

### toHash?

> `optional` **toHash**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L28)

***

### toMasked?

> `optional` **toMasked**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L29)

***

### type

> **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L26)
