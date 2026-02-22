---
editUrl: false
next: false
prev: false
title: "CloudflareObjectDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:148](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L148)

## Implements

- [`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new CloudflareObjectDeliveryTrackingStore**(`storage`, `options?`): `CloudflareObjectDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:157](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L157)

#### Parameters

##### storage

[`CloudflareObjectStorage`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflareobjectstorage/)

##### options?

`string` | `CloudflareObjectDeliveryTrackingStoreOptions`

#### Returns

`CloudflareObjectDeliveryTrackingStore`

## Methods

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:301](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L301)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:285](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L285)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:215](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L215)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:203](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L203)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:221](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L221)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:244](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L244)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:344](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L344)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L207)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
