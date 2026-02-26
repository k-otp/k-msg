---
editUrl: false
next: false
prev: false
title: "CryptoCircuitController"
---

Defined in: [packages/messaging/src/delivery-tracking/crypto-control-plane.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/crypto-control-plane.ts#L114)

## Implements

- [`DeliveryTrackingCryptoController`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/)

## Constructors

### Constructor

> **new CryptoCircuitController**(`options?`): `CryptoCircuitController`

Defined in: [packages/messaging/src/delivery-tracking/crypto-control-plane.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/crypto-control-plane.ts#L126)

#### Parameters

##### options?

`CryptoCircuitControllerOptions` = `{}`

#### Returns

`CryptoCircuitController`

## Methods

### beforeOperation()

> **beforeOperation**(`context`): `Promise`\<\{ `allowed`: `boolean`; `state`: [`FieldCryptoCircuitState`](/api/core/src/type-aliases/fieldcryptocircuitstate/); \}\>

Defined in: [packages/messaging/src/delivery-tracking/crypto-control-plane.ts:138](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/crypto-control-plane.ts#L138)

#### Parameters

##### context

[`DeliveryTrackingCryptoOperationContext`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptooperationcontext/)

#### Returns

`Promise`\<\{ `allowed`: `boolean`; `state`: [`FieldCryptoCircuitState`](/api/core/src/type-aliases/fieldcryptocircuitstate/); \}\>

#### Implementation of

[`DeliveryTrackingCryptoController`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/).[`beforeOperation`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/#beforeoperation)

***

### onFailure()

> **onFailure**(`context`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/crypto-control-plane.ts:201](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/crypto-control-plane.ts#L201)

#### Parameters

##### context

[`DeliveryTrackingCryptoOperationContext`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptooperationcontext/) & `object`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingCryptoController`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/).[`onFailure`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/#onfailure)

***

### onSuccess()

> **onSuccess**(`context`): `Promise`\<`void`\>

Defined in: [packages/messaging/src/delivery-tracking/crypto-control-plane.ts:174](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/delivery-tracking/crypto-control-plane.ts#L174)

#### Parameters

##### context

[`DeliveryTrackingCryptoOperationContext`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptooperationcontext/)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DeliveryTrackingCryptoController`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/).[`onSuccess`](/api/messaging/src/tracking/interfaces/deliverytrackingcryptocontroller/#onsuccess)
