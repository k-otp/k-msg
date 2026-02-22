---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingService"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L76)

## Constructors

### Constructor

> **new DeliveryTrackingService**(`config`): `DeliveryTrackingService`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L86)

#### Parameters

##### config

[`DeliveryTrackingServiceConfig`](/api/messaging/src/tracking/interfaces/deliverytrackingserviceconfig/)

#### Returns

`DeliveryTrackingService`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L130)

#### Returns

`Promise`\<`void`\>

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L234)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

##### groupBy

readonly [`DeliveryTrackingCountByField`](/api/messaging/src/tracking/type-aliases/deliverytrackingcountbyfield/)[]

#### Returns

`Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

***

### countRecords()

> **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:228](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L228)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

***

### getRecord()

> **getRecord**(`messageId`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L215)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L111)

#### Returns

`Promise`\<`void`\>

***

### listRecords()

> **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:220](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L220)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### recordSend()

> **recordSend**(`context`, `result`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L135)

#### Parameters

##### context

[`HookContext`](/api/messaging/src/interfaces/hookcontext/)

##### result

[`SendResult`](/api/core/src/interfaces/sendresult/)

#### Returns

`Promise`\<`void`\>

***

### runOnce()

> **runOnce**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:243](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L243)

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L115)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L124)

#### Returns

`void`
