---
editUrl: false
next: false
prev: false
title: "BunSqlDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L30)

## Implements

- [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new BunSqlDeliveryTrackingStore**(`options?`): `BunSqlDeliveryTrackingStore`

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L36)

#### Parameters

##### options?

`BunSqlDeliveryTrackingStoreOptions` = `{}`

#### Returns

`BunSqlDeliveryTrackingStore`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L118)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L104)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L100)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L86)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:78](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L78)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L90)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L94)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L111)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L82)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
