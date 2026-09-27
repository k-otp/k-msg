---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingServiceConfig"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:201](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L201)

## Properties

### apiFailover?

> `optional` **apiFailover?**: [`DeliveryTrackingApiFailoverConfig`](/en/api/messaging/src/tracking/interfaces/deliverytrackingapifailoverconfig/)

Defined in: [packages/messaging/src/delivery-tracking/service.ts:205](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L205)

***

### onStatusChange?

> `optional` **onStatusChange?**: (`change`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:220](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L220)

Called for each record a poll stored with a different status, with the
record as stored, after the poll finishes: for example, to notify a
webhook when a message is delivered or fails. Calls run one at a time,
in the order changes were stored, each with its own copy of the record;
`runOnce()` describes the one exception, in runtimes without
AsyncLocalStorage. It does not stop polling if it throws.

Delivery is best effort: a change whose callback throws is not retried,
and one stored just before the process stops is not reported, so
reconcile with the stored records when none may be missed. Services
polling the same store can also each report the same change, so make
it idempotent, for example by message id and status.

#### Parameters

##### change

[`DeliveryStatusChange`](/en/api/messaging/src/tracking/interfaces/deliverystatuschange/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### onStatusChangeError?

> `optional` **onStatusChangeError?**: (`error`, `change`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:225](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L225)

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

Defined in: [packages/messaging/src/delivery-tracking/service.ts:204](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L204)

***

### providers

> **providers**: [`Provider`](/en/api/core/src/interfaces/provider/)[]

Defined in: [packages/messaging/src/delivery-tracking/service.ts:202](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L202)

***

### store?

> `optional` **store?**: [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

Defined in: [packages/messaging/src/delivery-tracking/service.ts:203](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L203)
