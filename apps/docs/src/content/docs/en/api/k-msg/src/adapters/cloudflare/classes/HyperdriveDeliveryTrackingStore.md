---
editUrl: false
next: false
prev: false
title: "HyperdriveDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L115)

## Implements

- [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new HyperdriveDeliveryTrackingStore**(`client`, `options?`): `HyperdriveDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L122)

#### Parameters

##### client

[`CloudflareSqlClient`](/en/api/k-msg/src/adapters/cloudflare/interfaces/cloudflaresqlclient/)

##### options?

`HyperdriveDeliveryTrackingStoreOptions` = `{}`

#### Returns

`HyperdriveDeliveryTrackingStore`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:504](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L504)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:320](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L320)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:306](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L306)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:236](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L236)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:170](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L170)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:248](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L248)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:273](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L273)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:363](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L363)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:192](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L192)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
