---
editUrl: false
next: false
prev: false
title: "BunSqlDeliveryTrackingStore"
---

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:4

## Implements

- `DeliveryTrackingStore`

## Constructors

### Constructor

> **new BunSqlDeliveryTrackingStore**(`options?`): `BunSqlDeliveryTrackingStore`

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:7

#### Parameters

##### options?

###### options?

`Options`

###### sql?

`SQL`

#### Returns

`BunSqlDeliveryTrackingStore`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:19

#### Returns

`Promise`\<`void`\>

#### Implementation of

`DeliveryTrackingStore.close`

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<`DeliveryTrackingCountByRow`[]\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:17

#### Parameters

##### filter

`DeliveryTrackingRecordFilter`

##### groupBy

readonly `DeliveryTrackingCountByField`[]

#### Returns

`Promise`\<`DeliveryTrackingCountByRow`[]\>

#### Implementation of

`DeliveryTrackingStore.countBy`

***

### countRecords()

> **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:16

#### Parameters

##### filter

`DeliveryTrackingRecordFilter`

#### Returns

`Promise`\<`number`\>

#### Implementation of

`DeliveryTrackingStore.countRecords`

***

### get()

> **get**(`messageId`): `Promise`\<`TrackingRecord` \| `undefined`\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:13

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<`TrackingRecord` \| `undefined`\>

#### Implementation of

`DeliveryTrackingStore.get`

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:11

#### Returns

`Promise`\<`void`\>

#### Implementation of

`DeliveryTrackingStore.init`

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<`TrackingRecord`[]\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:14

#### Parameters

##### now

`Date`

##### limit

`number`

#### Returns

`Promise`\<`TrackingRecord`[]\>

#### Implementation of

`DeliveryTrackingStore.listDue`

***

### listRecords()

> **listRecords**(`options`): `Promise`\<`TrackingRecord`[]\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:15

#### Parameters

##### options

`DeliveryTrackingListOptions`

#### Returns

`Promise`\<`TrackingRecord`[]\>

#### Implementation of

`DeliveryTrackingStore.listRecords`

***

### patch()

> **patch**(`messageId`, `patch`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:18

#### Parameters

##### messageId

`string`

##### patch

`Partial`\<`TrackingRecord`\>

#### Returns

`Promise`\<`void`\>

#### Implementation of

`DeliveryTrackingStore.patch`

***

### upsert()

> **upsert**(`record`): `Promise`\<`void`\>

Defined in: packages/messaging/dist/delivery-tracking/stores/bun-sql.store.d.ts:12

#### Parameters

##### record

`TrackingRecord`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`DeliveryTrackingStore.upsert`
