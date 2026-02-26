---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingFieldCryptoOptions"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L70)

## Properties

### config

> **config**: [`FieldCryptoConfig`](/api/core/src/interfaces/fieldcryptoconfig/)

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L71)

***

### controlSignal?

> `optional` **controlSignal**: [`DeliveryTrackingFieldCryptoControlSignalOptions`](/api/messaging/src/tracking/interfaces/deliverytrackingfieldcryptocontrolsignaloptions/)

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L79)

***

### metrics()?

> `optional` **metrics**: (`event`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L73)

#### Parameters

##### event

[`FieldCryptoMetricEvent`](/api/core/src/interfaces/fieldcryptometricevent/) & `object`

#### Returns

`void` \| `Promise`\<`void`\>

***

### tenantId?

> `optional` **tenantId**: `string`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L72)
