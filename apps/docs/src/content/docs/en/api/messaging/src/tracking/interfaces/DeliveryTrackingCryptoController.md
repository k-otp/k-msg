---
editUrl: false
next: false
prev: false
title: "DeliveryTrackingCryptoController"
---

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L92)

## Methods

### beforeOperation()?

> `optional` **beforeOperation**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `allowed`: `boolean`; `state`: [`FieldCryptoCircuitState`](/en/api/core/src/type-aliases/fieldcryptocircuitstate/); \}\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:93](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L93)

#### Parameters

##### context

[`DeliveryTrackingCryptoOperationContext`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcryptooperationcontext/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `allowed`: `boolean`; `state`: [`FieldCryptoCircuitState`](/en/api/core/src/type-aliases/fieldcryptocircuitstate/); \}\>

***

### onFailure()?

> `optional` **onFailure**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L102)

#### Parameters

##### context

[`DeliveryTrackingCryptoOperationContext`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcryptooperationcontext/) & `object`

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`void`\>

***

### onSuccess()?

> `optional` **onSuccess**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/store.interface.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/store.interface.ts#L99)

#### Parameters

##### context

[`DeliveryTrackingCryptoOperationContext`](/en/api/messaging/src/tracking/interfaces/deliverytrackingcryptooperationcontext/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`void`\>
