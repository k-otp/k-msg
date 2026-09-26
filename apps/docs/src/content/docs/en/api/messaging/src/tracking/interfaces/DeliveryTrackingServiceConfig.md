---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingServiceConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L150)

## Properties

### apiFailover?

> `optional` **apiFailover?**: [`DeliveryTrackingApiFailoverConfig`](/en/api/messaging/src/tracking/interfaces/deliverytrackingapifailoverconfig/)

Defined in: [packages/messaging/src/delivery-tracking/service.ts:154](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L154)

***

### onStatusChange?

> `optional` **onStatusChange?**: (`change`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L165)

Called for each record a poll stored with a different status, with the
record as stored, after the poll finishes: for example, to notify a
webhook when a message is delivered or fails. Calls run one at a time,
in the order changes were stored, each with its own copy of the record;
see `runOnce()` for the one exception, in runtimes without
AsyncLocalStorage. It does not stop polling if it throws. Delivery is at least once:
services polling the same store can each report the same change, so
make it idempotent, for example by message id and status.

#### Parameters

##### change

[`DeliveryStatusChange`](/en/api/messaging/src/tracking/interfaces/deliverystatuschange/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onStatusChangeError?

> `optional` **onStatusChangeError?**: (`error`, `change`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L170)

Receives what `onStatusChange` throws. Without it, or when it throws
too, the error is written to `console.error`.

#### Parameters

##### error

`unknown`

##### change

[`DeliveryStatusChange`](/en/api/messaging/src/tracking/interfaces/deliverystatuschange/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### polling?

> `optional` **polling?**: `Partial`\<[`DeliveryTrackingPollingConfig`](/en/api/messaging/src/tracking/interfaces/deliverytrackingpollingconfig/)\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:153](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L153)

***

### providers

> **providers**: [`Provider`](/en/api/core/src/interfaces/provider/)[]

Defined in: [packages/messaging/src/delivery-tracking/service.ts:151](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L151)

***

### store?

> `optional` **store?**: [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

Defined in: [packages/messaging/src/delivery-tracking/service.ts:152](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L152)
