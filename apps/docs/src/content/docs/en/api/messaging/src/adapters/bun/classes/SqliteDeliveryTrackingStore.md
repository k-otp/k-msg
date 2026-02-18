---
editUrl: false
next: false
prev: false
title: "SqliteDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L55)

## Implements

- [`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new SqliteDeliveryTrackingStore**(`options?`): `SqliteDeliveryTrackingStore`

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L59)

#### Parameters

##### options?

`SqliteDeliveryTrackingStoreOptions` = `{}`

#### Returns

`SqliteDeliveryTrackingStore`

## Methods

### close()

> **close**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:397](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L397)

#### Returns

`void`

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:339](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L339)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:328](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L328)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:201](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L201)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L63)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:234](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L234)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:274](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L274)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:381](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L381)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L128)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
