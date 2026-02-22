---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingRetentionConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L53)

## Properties

### contractOverrideResolver()?

> `optional` **contractOverrideResolver**: (`context`) => `number` \| `Promise`\<`number` \| `undefined`\> \| `undefined`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L56)

#### Parameters

##### context

###### defaultDays

`number`

###### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

###### retentionClass

[`DeliveryTrackingRetentionClass`](/api/messaging/src/tracking/type-aliases/deliverytrackingretentionclass/)

###### tenantId?

`string`

#### Returns

`number` \| `Promise`\<`number` \| `undefined`\> \| `undefined`

***

### preset?

> `optional` **preset**: `"kr-b2b-baseline"`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L54)

***

### tenantOverrideDays?

> `optional` **tenantOverrideDays**: `Partial`\<`Record`\<[`DeliveryTrackingRetentionClass`](/api/messaging/src/tracking/type-aliases/deliverytrackingretentionclass/), `number`\>\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L55)
