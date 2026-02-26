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

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L137)

#### Returns

`void` \| `Promise`\<`void`\>

***

### countBy()?

> `optional` **countBy**(`filter`, `groupBy`): `Promise`\<[`DeliveryTrackingCountByRow`](/api/messaging/src/tracking/interfaces/deliverytrackingcountbyrow/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:132](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L132)

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

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L131)

#### Parameters

##### filter

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

#### Returns

`Promise`\<`number`\>

***

### get()

> **get**(`messageId`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L128)

#### Parameters

##### messageId

`string`

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/) \| `undefined`\>

***

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L126)

#### Returns

`Promise`\<`void`\>

***

### listDue()

> **listDue**(`now`, `limit`): `Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:129](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L129)

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

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L130)

#### Parameters

##### options

[`DeliveryTrackingListOptions`](/api/messaging/src/tracking/interfaces/deliverytrackinglistoptions/)

#### Returns

`Promise`\<[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)[]\>

***

### patch()

> **patch**(`messageId`, `patch`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L136)

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

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L127)

#### Parameters

##### record

[`TrackingRecord`](/api/messaging/src/tracking/interfaces/trackingrecord/)

#### Returns

`Promise`\<`void`\>
