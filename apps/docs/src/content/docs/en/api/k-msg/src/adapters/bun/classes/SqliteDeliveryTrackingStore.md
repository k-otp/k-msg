---
editUrl: false
next: false
prev: false
title: "SqliteDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L56)

## Implements

- [`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new SqliteDeliveryTrackingStore**(`options?`): `SqliteDeliveryTrackingStore`

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L60)

#### Parameters

##### options?

`SqliteDeliveryTrackingStoreOptions` = `{}`

#### Returns

`SqliteDeliveryTrackingStore`

## Methods

### close()

> **close**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:392](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L392)

#### Returns

`void`

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:330](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L330)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:317](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L317)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:184](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L184)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L64)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:219](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L219)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L261)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:374](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L374)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L109)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
