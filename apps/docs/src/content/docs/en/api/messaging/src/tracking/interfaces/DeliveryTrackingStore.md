---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingStore"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:39](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L39)

## Methods

### close()?

> `optional` **close**(): `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:51](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L51)

#### Returns

`void` \| `Promise`\<`void`\>

***

### countBy()?

> `optional` **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:46](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L46)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

##### groupBy

readonly [`DeliveryTrackingCountByField`](/api/messaging/src/tracking/type-aliases/deliverytrackingcountbyfield/)[]

#### Returns

`Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

***

### countRecords()?

> `optional` **countRecords**(`filter`): `Promise`\<`number`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:45](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L45)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

***

### get()

> **get**(`messageId`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:42](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L42)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:40](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L40)

#### Returns

`Promise`\<`void`\>

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:43](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L43)

#### Parameters

##### now

`Date`

##### limit

`number`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### listRecords()?

> `optional` **listRecords**(`options`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:44](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L44)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### patch()

> **patch**(`messageId`, `patch`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:50](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L50)

#### Parameters

##### messageId

`string`

##### patch

`Partial`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)\>

#### Returns

`Promise`\<`void`\>

***

### upsert()

> **upsert**(`record`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:41](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/delivery-tracking/store.interface.ts#L41)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>
