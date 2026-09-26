---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingService"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:176](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L176)

## Constructors

### Constructor

> **new DeliveryTrackingService**(`config`): `DeliveryTrackingService`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:194](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L194)

#### Parameters

##### config

[`DeliveryTrackingServiceConfig`](/en/api/messaging/src/tracking/interfaces/deliverytrackingserviceconfig/)

#### Returns

`DeliveryTrackingService`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:240](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L240)

#### Returns

`Promise`\<`void`\>

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:344](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L344)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

##### groupBy

readonly [`DeliveryTrackingCountByField`](/en/api/messaging/src/tracking/type-aliases/deliverytrackingcountbyfield/)[]

#### Returns

`Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

***

### countRecords()

> **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:338](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L338)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

***

### getRecord()

> **getRecord**(`messageId`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:325](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L325)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:221](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L221)

#### Returns

`Promise`\<`void`\>

***

### listRecords()

> **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:330](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L330)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/en/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### recordSend()

> **recordSend**(`context`, `result`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:245](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L245)

#### Parameters

##### context

[`HookContext`](/en/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/en/api/core/src/interfaces/sendresult/)

#### Returns

`Promise`\<`void`\>

***

### runOnce()

> **runOnce**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:368](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L368)

Polls the records that are due once, or joins a poll already running.
It resolves once the poll's status changes have been delivered to
`onStatusChange`. A callback may call it too, as may a callback of
another service: while this service is delivering, such a call resolves
once the poll's changes are queued, since they may be delivered after
the callback. Work a callback starts without awaiting it counts as the
callback's.

A runtime without AsyncLocalStorage, such as Workers without
nodejs_compat on older compatibility dates, cannot tell those calls
from others. There, a poll that ends while callbacks run delivers its
changes at once, beside them rather than after them, and every call
waits until its changes are delivered.

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:225](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L225)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L234)

#### Returns

`void`
