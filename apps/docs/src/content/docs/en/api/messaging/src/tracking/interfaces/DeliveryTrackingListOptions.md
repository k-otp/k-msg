---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingListOptions"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:23](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L23)

## Extends

- [`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/)

## Properties

### from?

> `optional` **from**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L15)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`from`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#from)

***

### fromHash?

> `optional` **fromHash**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:16](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L16)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`fromHash`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#fromhash)

***

### limit

> **limit**: `number`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L25)

***

### messageId?

> `optional` **messageId**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L8)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`messageId`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#messageid)

***

### offset?

> `optional` **offset**: `number`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L26)

***

### orderBy?

> `optional` **orderBy**: `DeliveryTrackingRecordOrderBy`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L27)

***

### orderDirection?

> `optional` **orderDirection**: `DeliveryTrackingRecordOrderDirection`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L28)

***

### providerId?

> `optional` **providerId**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:9](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L9)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`providerId`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#providerid)

***

### providerMessageId?

> `optional` **providerMessageId**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L10)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`providerMessageId`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#providermessageid)

***

### requestedAtFrom?

> `optional` **requestedAtFrom**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L17)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`requestedAtFrom`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#requestedatfrom)

***

### requestedAtTo?

> `optional` **requestedAtTo**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L18)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`requestedAtTo`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#requestedatto)

***

### status?

> `optional` **status**: [`DeliveryStatus`](/api/core/src/type-aliases/deliverystatus/) \| [`DeliveryStatus`](/api/core/src/type-aliases/deliverystatus/)[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:12](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L12)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`status`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#status)

***

### statusUpdatedAtFrom?

> `optional` **statusUpdatedAtFrom**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L19)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`statusUpdatedAtFrom`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#statusupdatedatfrom)

***

### statusUpdatedAtTo?

> `optional` **statusUpdatedAtTo**: `Date`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L20)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`statusUpdatedAtTo`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#statusupdatedatto)

***

### to?

> `optional` **to**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L13)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`to`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#to)

***

### toHash?

> `optional` **toHash**: `string` \| `string`[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L14)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`toHash`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#tohash)

***

### type?

> `optional` **type**: [`MessageType`](/api/core/src/type-aliases/messagetype/) \| [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:11](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L11)

#### Inherited from

[`DeliveryTrackingRecordFilter`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/).[`type`](/api/messaging/src/tracking/interfaces/deliverytrackingrecordfilter/#type)
