---
editUrl: false
next: false
prev: false
title: "Provider"
---

Defined in: [packages/core/src/provider.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L108)

## Properties

### id

> `readonly` **id**: `string`

Defined in: [packages/core/src/provider.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L109)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/provider.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L110)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/core/src/provider.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L111)

## Methods

### getDeliveryStatus()?

> `optional` **getDeliveryStatus**(`query`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:115](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L115)

#### Parameters

##### query

[`DeliveryStatusQuery`](/api/core/src/interfaces/deliverystatusquery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### getOnboardingSpec()?

> `optional` **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/core/src/provider.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L118)

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/core/src/provider.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L113)

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

***

### send()

> **send**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L114)

#### Parameters

##### params

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
