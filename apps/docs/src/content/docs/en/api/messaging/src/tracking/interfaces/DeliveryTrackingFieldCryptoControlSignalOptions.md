---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingFieldCryptoControlSignalOptions"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L110)

## Properties

### controller?

> `optional` **controller**: [`DeliveryTrackingCryptoController`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/)

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:116](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L116)

***

### cooldownMs?

> `optional` **cooldownMs**: `number`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L115)

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L111)

***

### failureThreshold?

> `optional` **failureThreshold**: `number`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L113)

***

### onStateChange()?

> `optional` **onStateChange**: (`event`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L117)

#### Parameters

##### event

[`FieldCryptoControlSignalEvent`](/api/core/src/interfaces/fieldcryptocontrolsignalevent/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### runbookTrigger()?

> `optional` **runbookTrigger**: (`event`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L120)

#### Parameters

##### event

[`FieldCryptoControlSignalEvent`](/api/core/src/interfaces/fieldcryptocontrolsignalevent/)

#### Returns

`void` \| `Promise`\<`void`\>

***

### scopeBy?

> `optional` **scopeBy**: `"tenant_provider_kid"` \| `"tenant_provider"`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:112](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L112)

***

### windowMs?

> `optional` **windowMs**: `number`

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L114)
