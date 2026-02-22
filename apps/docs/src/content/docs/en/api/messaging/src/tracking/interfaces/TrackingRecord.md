---
editUrl: false
next: false
prev: false
title: "TrackingRecord"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L16)

## Properties

### attemptCount

> **attemptCount**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L40)

***

### cryptoKid?

> `optional` **cryptoKid**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L48)

***

### cryptoState?

> `optional` **cryptoState**: `"plain"` \| `"encrypted"` \| `"degraded"`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L50)

***

### cryptoVersion?

> `optional` **cryptoVersion**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L49)

***

### deliveredAt?

> `optional` **deliveredAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L37)

***

### failedAt?

> `optional` **failedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L38)

***

### fieldModes?

> `optional` **fieldModes**: `Partial`\<`Record`\<`string`, [`FieldMode`](/api/core/src/type-aliases/fieldmode/)\>\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L53)

***

### from?

> `optional` **from**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L28)

***

### fromHash?

> `optional` **fromHash**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L29)

***

### fromMasked?

> `optional` **fromMasked**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L30)

***

### lastCheckedAt?

> `optional` **lastCheckedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L41)

***

### lastError?

> `optional` **lastError**: [`TrackingError`](/api/messaging/src/tracking/interfaces/trackingerror/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L43)

***

### messageId

> **messageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L17)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L45)

***

### metadataEncrypted?

> `optional` **metadataEncrypted**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L47)

***

### metadataHashes?

> `optional` **metadataHashes**: `Record`\<`string`, `string`\>

Defined in: [packages/messaging/src/delivery-tracking/types.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L46)

***

### nextCheckAt

> **nextCheckAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L42)

***

### providerId

> **providerId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L18)

***

### providerMessageId

> **providerMessageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L23)

Provider-assigned message id used to query status APIs.
When missing, store implementations may persist an empty string and the tracker will stop polling.

***

### providerStatusCode?

> `optional` **providerStatusCode**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L34)

***

### providerStatusMessage?

> `optional` **providerStatusMessage**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L35)

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:44](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L44)

***

### requestedAt

> **requestedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L31)

***

### retentionBucketYm?

> `optional` **retentionBucketYm**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L52)

***

### retentionClass?

> `optional` **retentionClass**: `"opsLogs"` \| `"telecomMetadata"` \| `"billingEvidence"`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L51)

***

### scheduledAt?

> `optional` **scheduledAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L32)

***

### sentAt?

> `optional` **sentAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L36)

***

### status

> **status**: [`DeliveryStatus`](/api/core/src/type-aliases/deliverystatus/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L33)

***

### statusUpdatedAt

> **statusUpdatedAt**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L39)

***

### to

> **to**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L25)

***

### toHash?

> `optional` **toHash**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L26)

***

### toMasked?

> `optional` **toMasked**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L27)

***

### type

> **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L24)
