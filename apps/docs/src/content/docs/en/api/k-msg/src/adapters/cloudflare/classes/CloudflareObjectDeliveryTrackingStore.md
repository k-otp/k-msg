---
editUrl: false
next: false
prev: false
title: "CloudflareObjectDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:151](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L151)

## Implements

- [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new CloudflareObjectDeliveryTrackingStore**(`storage`, `options?`): `CloudflareObjectDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:160](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L160)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:301](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L301)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:286](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L286)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:218](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L218)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:206](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L206)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:224](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L224)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:246](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L246)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:343](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L343)

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

Defined in: [packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts:210](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/object-delivery-tracking.store.ts#L210)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
