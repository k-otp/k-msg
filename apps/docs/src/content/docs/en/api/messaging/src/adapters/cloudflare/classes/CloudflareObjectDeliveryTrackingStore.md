---
editUrl: false
next: false
prev: false
title: "CloudflareObjectDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L108)

## Implements

- [`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new CloudflareObjectDeliveryTrackingStore**(`storage`, `keyPrefix?`): `CloudflareObjectDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L111)

#### Parameters

##### storage

[`CloudflareObjectStorage`](/api/messaging/src/adapters/cloudflare/interfaces/cloudflareobjectstorage/)

##### keyPrefix?

`string` = `"kmsg/delivery-tracking"`

#### Returns

`CloudflareObjectDeliveryTrackingStore`

## Methods

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:212](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L212)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

##### groupBy

readonly [`DeliveryTrackingCountByField`](/api/messaging/src/tracking/type-aliases/deliverytrackingcountbyfield/)[]

#### Returns

`Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`countBy`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#countby)

***

### countRecords()

> **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:197](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L197)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`countRecords`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#countrecords)

***

### get()

> **get**(`messageId`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L128)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`get`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#get)

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L116)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:134](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L134)

#### Parameters

##### now

`Date`

##### limit

`number`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`listDue`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#listdue)

***

### listRecords()

> **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:157](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L157)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`listRecords`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#listrecords)

***

### patch()

> **patch**(`messageId`, `patch`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:254](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L254)

#### Parameters

##### messageId

`string`

##### patch

`Partial`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`patch`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#patch)

***

### upsert()

> **upsert**(`record`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L120)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
