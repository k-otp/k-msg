---
editUrl: false
next: false
prev: false
title: "HyperdriveDeliveryTrackingStore"
---

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L122)

## Implements

- [`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/)

## Constructors

### Constructor

> **new HyperdriveDeliveryTrackingStore**(`client`, `options?`): `HyperdriveDeliveryTrackingStore`

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L129)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:729](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L729)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`close`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#close)

***

### countBy()

> **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:442](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L442)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:427](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L427)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:243](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L243)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:177](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L177)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`init`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#init)

***

### leaseDue()

> **leaseDue**(`now`, `limit`, `leaseUntil`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[] \| `undefined`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:280](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L280)

Like `listDue`, but also leases the records it returns: in the same
atomic step their `nextCheckAt` moves to `leaseUntil`, so other pollers
of the store skip them until the poll stores their next check or the
lease runs out. It resolves `undefined` when this store cannot lease
atomically. `DeliveryTrackingService` leases only with a store that has
both this and `patchLeased`, and otherwise uses `listDue`.

#### Parameters

##### now

`Date`

##### limit

`number`

##### leaseUntil

`Date`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[] \| `undefined`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`leaseDue`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#leasedue)

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:255](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L255)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:393](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L393)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:486](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L486)

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

### patchLeased()

> **patchLeased**(`messageId`, `leaseUntil`, `patch`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:513](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L513)

Applies `patch` only while the record is still leased until `leaseUntil`
(its `nextCheckAt` equals it), and resolves whether it did. The check
and the write are one atomic step, as in `leaseDue`. A poll stores its
results this way, so one that ran past its lease cannot overwrite what
another poll stored since.

#### Parameters

##### messageId

`string`

##### leaseUntil

`Date`

##### patch

`Partial`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)\>

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`patchLeased`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#patchleased)

***

### releaseLeases()

> **releaseLeases**(`messageIds`, `leaseUntil`, `nextCheckAt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:332](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L332)

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

Defined in: [packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts:199](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/adapters/cloudflare/hyperdrive-delivery-tracking.store.ts#L199)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingStore`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/).[`upsert`](/en/api/messaging/src/tracking/interfaces/deliverytrackingstore/#upsert)
