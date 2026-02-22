---
editUrl: false
next: false
prev: false
title: "SqliteDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L30)

## Implements

- [`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new SqliteDeliveryTrackingStore**(`options?`): `SqliteDeliveryTrackingStore`

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L35)

#### Parameters

##### options?

`SqliteDeliveryTrackingStoreOptions` = `{}`

#### Returns

`SqliteDeliveryTrackingStore`

## Methods

### close()

> **close**(): `void`

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:125](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L125)

#### Returns

`void`

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L111)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L107)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L93)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L85)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L97)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L101)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L118)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/sqlite.store.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/sqlite.store.ts#L89)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
