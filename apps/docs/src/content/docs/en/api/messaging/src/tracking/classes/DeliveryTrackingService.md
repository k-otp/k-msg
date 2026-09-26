---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingService"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:175](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L175)

## Constructors

### Constructor

> **new DeliveryTrackingService**(`config`): `DeliveryTrackingService`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:191](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L191)

#### Parameters

##### config

[`DeliveryTrackingServiceConfig`](/en/api/messaging/src/tracking/interfaces/deliverytrackingserviceconfig/)

#### Returns

`DeliveryTrackingService`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:237](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L237)

#### Returns

`Promise`\<`void`\>

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:341](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L341)

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

Defined in: [packages/messaging/src/delivery-tracking/service.ts:335](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L335)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

***

### getRecord()

> **getRecord**(`messageId`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:322](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L322)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:218](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L218)

#### Returns

`Promise`\<`void`\>

***

### listRecords()

> **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:327](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L327)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/en/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### recordSend()

> **recordSend**(`context`, `result`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:242](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L242)

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

Defined in: [packages/messaging/src/delivery-tracking/service.ts:360](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L360)

Polls the records that are due once, or joins a poll already running.
It resolves once the poll's status changes have been delivered to
`onStatusChange`. A callback may call it too, as may a callback of
another service: while this service is delivering, such a call resolves
once the poll's changes are queued, since they may be delivered after
the callback. Work a callback starts without awaiting it counts as the
callback's, and in a runtime without AsyncLocalStorage, so does every
call made while this service delivers.

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:222](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L222)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:231](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L231)

#### Returns

`void`
