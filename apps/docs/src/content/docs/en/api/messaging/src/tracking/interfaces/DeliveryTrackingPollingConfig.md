---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingPollingConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/types.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L100)

## Properties

### backoffMs

> **backoffMs**: `number`[]

Defined in: [packages/messaging/src/delivery-tracking/types.ts:106](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L106)

***

### batchSize

> **batchSize**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L102)

***

### concurrency

> **concurrency**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L103)

***

### initialDelayMs

> **initialDelayMs**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L104)

***

### intervalMs

> **intervalMs**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L101)

***

### leaseMs?

> `optional` **leaseMs?**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L117)

How long a poll may hold the records it takes, when the store supports
`leaseDue`. While it holds them, other services polling the same store
skip them. A poll stores each record's next check as it goes and hands
back the records it does not finish, so the duration matters only when a
poll runs longer or stops without doing that. 0 turns leasing off.

#### Default

```ts
300_000 (5 minutes)
```

***

### maxTrackingDurationMs

> **maxTrackingDurationMs**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L107)

***

### scheduledGraceMs

> **scheduledGraceMs**: `number`

Defined in: [packages/messaging/src/delivery-tracking/types.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L105)

***

### unsupportedProviderStrategy

> **unsupportedProviderStrategy**: [`UnsupportedProviderStrategy`](/en/api/messaging/src/tracking/type-aliases/unsupportedproviderstrategy/)

Defined in: [packages/messaging/src/delivery-tracking/types.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/types.ts#L108)
