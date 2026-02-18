---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingService"
---

Defined in: [packages/messaging/src/delivery-tracking/service.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L70)

## Constructors

### Constructor

> **new DeliveryTrackingService**(`config`): `DeliveryTrackingService`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L80)

#### Parameters

##### config

[`DeliveryTrackingServiceConfig`](/api/messaging/src/tracking/interfaces/deliverytrackingserviceconfig/)

#### Returns

`DeliveryTrackingService`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L124)

#### Returns

`Promise`\<`void`\>

***

### getRecord()

> **getRecord**(`messageId`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:209](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L209)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L105)

#### Returns

`Promise`\<`void`\>

***

### recordSend()

> **recordSend**(`context`, `result`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/service.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L129)

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

Defined in: [packages/messaging/src/delivery-tracking/service.ts:214](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L214)

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L109)

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/service.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/service.ts#L118)

#### Returns

`void`
