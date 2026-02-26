---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingRetentionConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L59)

## Properties

### contractOverrideResolver()?

> `optional` **contractOverrideResolver**: (`context`) => `number` \| `Promise`\<`number` \| `undefined`\> \| `undefined`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L62)

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

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L60)

***

### tenantOverrideDays?

> `optional` **tenantOverrideDays**: `Partial`\<`Record`\<[`DeliveryTrackingRetentionClass`](/api/messaging/src/tracking/type-aliases/deliverytrackingretentionclass/), `number`\>\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L61)
