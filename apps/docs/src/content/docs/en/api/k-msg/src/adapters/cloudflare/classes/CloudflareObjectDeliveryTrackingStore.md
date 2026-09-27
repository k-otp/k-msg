---
editUrl: false
next: false
prev: false
title: "CloudflareObjectDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L156)

## Implements

- [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new CloudflareObjectDeliveryTrackingStore**(`storage`, `options?`): `CloudflareObjectDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L165)

#### Parameters

##### storage

[`CloudflareObjectStorage`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectstorage/)

##### options?

`string` \| `CloudflareObjectDeliveryTrackingStoreOptions`

#### Returns

`CloudflareObjectDeliveryTrackingStore`

## Methods

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:308](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L308)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

##### groupBy

readonly [`DeliveryTrackingCountByField`](/en/api/messaging/src/tracking/type-aliases/deliverytrackingcountbyfield/)[]

#### Returns

`Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`countBy`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#countby)

***

### countRecords()

> **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:292](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L292)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`countRecords`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#countrecords)

***

### get()

> **get**(`messageId`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:223](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L223)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`get`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#get)

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:211](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L211)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:229](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L229)

#### Parameters

##### now

`Date`

##### limit

`number`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`listDue`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#listdue)

***

### listRecords()

> **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:251](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L251)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/en/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`listRecords`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#listrecords)

***

### patch()

> **patch**(`messageId`, `patch`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:351](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L351)

#### Parameters

##### messageId

`string`

##### patch

`Partial`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`patch`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#patch)

***

### upsert()

> **upsert**(`record`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L215)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
