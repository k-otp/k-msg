---
editUrl: false
next: false
prev: false
title: "HyperdriveDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L102)

## Implements

- [`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new HyperdriveDeliveryTrackingStore**(`client`, `options?`): `HyperdriveDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L108)

#### Parameters

##### client

[`CloudflareSqlClient`](/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### options?

`HyperdriveDeliveryTrackingStoreOptions` = `{}`

#### Returns

`HyperdriveDeliveryTrackingStore`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:485](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L485)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:301](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L301)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:287](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L287)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:217](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L217)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L155)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:229](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L229)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:254](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L254)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:344](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L344)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:175](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L175)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
