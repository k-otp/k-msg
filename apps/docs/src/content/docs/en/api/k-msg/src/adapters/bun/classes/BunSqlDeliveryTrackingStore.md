---
editUrl: false
next: false
prev: false
title: "BunSqlDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L34)

## Implements

- [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new BunSqlDeliveryTrackingStore**(`options?`): `BunSqlDeliveryTrackingStore`

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L40)

#### Parameters

##### options?

`BunSqlDeliveryTrackingStoreOptions` = `{}`

#### Returns

`BunSqlDeliveryTrackingStore`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:142](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L142)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L128)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L124)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:94](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L94)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L86)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### leaseDue()

> **leaseDue**(`now`, `limit`, `leaseUntil`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L102)

Like `listDue`, but also leases the records it returns: in the same
atomic step their `nextCheckAt` moves to `leaseUntil`, so other pollers
of the store skip them until the poll stores their next check or the
lease runs out. Without it, `DeliveryTrackingService` uses `listDue`.

#### Parameters

##### now

`Date`

##### limit

`number`

##### leaseUntil

`Date`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`leaseDue`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#leasedue)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L98)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L118)

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

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L135)

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

### releaseLeases()

> **releaseLeases**(`messageIds`, `leaseUntil`, `nextCheckAt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L110)

Hands back leases a poll did not finish: moves `nextCheckAt` to the
given time on those records whose `nextCheckAt` is still `leaseUntil`.
A record another poll has leased since is left alone. Without it,
`DeliveryTrackingService` lets such leases run out.

#### Parameters

##### messageIds

readonly `string`[]

##### leaseUntil

`Date`

##### nextCheckAt

`Date`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`releaseLeases`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#releaseleases)

***

### upsert()

> **upsert**(`record`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/stores/bun-sql.store.ts#L90)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
