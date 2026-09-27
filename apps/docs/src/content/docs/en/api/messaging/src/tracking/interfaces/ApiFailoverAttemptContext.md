---
editUrl: false
next: false
prev: false
title: "ApiFailoverAttemptContext"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L70)

## Properties

### fallbackMessageId

> **fallbackMessageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L74)

***

### fallbackType

> **fallbackType**: `"SMS"` \| `"LMS"`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L75)

***

### originalMessageId

> **originalMessageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L71)

***

### originalProviderId

> **originalProviderId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L72)

***

### originalProviderMessageId

> **originalProviderMessageId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L73)

***

### record

> **record**: [`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L76)

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L83)

Aborts when the poll is stopped, by the signal given to `runOnce()` or
by `close()`. Pass it to the send so that `close()` does not wait for a
send in progress; a send cancelled this way is recorded as a failed
attempt and not tried again.
