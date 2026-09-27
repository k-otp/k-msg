---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:125](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L125)

## Methods

### close()?

> `optional` **close**(): `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:173](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L173)

#### Returns

`void` \| `Promise`\<`void`\>

***

### countBy()?

> `optional` **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:168](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L168)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

##### groupBy

readonly [`DeliveryTrackingCountByField`](/en/api/messaging/src/tracking/type-aliases/deliverytrackingcountbyfield/)[]

#### Returns

`Promise`\<[`DeliveryTrackingCountByRow`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

***

### countRecords()?

> `optional` **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:167](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L167)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/en/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

***

### get()

> **get**(`messageId`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L128)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L126)

#### Returns

`Promise`\<`void`\>

***

### leaseDue()?

> `optional` **leaseDue**(`now`, `limit`, `leaseUntil`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[] \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L138)

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

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L129)

#### Parameters

##### now

`Date`

##### limit

`number`

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### listRecords()?

> `optional` **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:166](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L166)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/en/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### patch()

> **patch**(`messageId`, `patch`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L172)

#### Parameters

##### messageId

`string`

##### patch

`Partial`\<[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)\>

#### Returns

`Promise`\<`void`\>

***

### patchLeased()?

> `optional` **patchLeased**(`messageId`, `leaseUntil`, `patch`): `Promise`\<`boolean`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L150)

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

***

### releaseLeases()?

> `optional` **releaseLeases**(`messageIds`, `leaseUntil`, `nextCheckAt`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L161)

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

***

### upsert()

> **upsert**(`record`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L127)

#### Parameters

##### record

[`TrackingRecord`](/en/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>
