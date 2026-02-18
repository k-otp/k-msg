---
editUrl: false
next: false
prev: false
title: "SolapiProvider"
---

Defined in: [packages/provider/src/solapi/provider.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L26)

SOLAPI Provider package entrypoint

## Implements

- [`Provider`](/api/core/src/interfaces/provider/)
- [`BalanceProvider`](/api/core/src/interfaces/balanceprovider/)

## Constructors

### Constructor

> **new SolapiProvider**(`config`, `client?`): `SolapiProvider`

Defined in: [packages/provider/src/solapi/provider.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L57)

#### Parameters

##### config

[`SolapiConfig`](/api/provider/src/solapi/interfaces/solapiconfig/)

##### client?

`SolapiSdkClient`

#### Returns

`SolapiProvider`

## Properties

### id

> `readonly` **id**: `"solapi"` = `"solapi"`

Defined in: [packages/provider/src/solapi/provider.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L27)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`id`](/api/core/src/interfaces/provider/#id)

***

### name

> `readonly` **name**: `"SOLAPI Messaging Provider"` = `"SOLAPI Messaging Provider"`

Defined in: [packages/provider/src/solapi/provider.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L28)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`name`](/api/core/src/interfaces/provider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/solapi/provider.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L29)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`supportedTypes`](/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L136)

#### Parameters

##### query?

[`BalanceQuery`](/api/core/src/interfaces/balancequery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`BalanceProvider`](/api/core/src/interfaces/balanceprovider/).[`getBalance`](/api/core/src/interfaces/balanceprovider/#getbalance)

***

### getDeliveryStatus()

> **getDeliveryStatus**(`query`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L126)

#### Parameters

##### query

[`DeliveryStatusQuery`](/api/core/src/interfaces/deliverystatusquery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getDeliveryStatus`](/api/core/src/interfaces/provider/#getdeliverystatus)

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/solapi/provider.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L49)

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/api/core/src/interfaces/provider/#getonboardingspec)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/solapi/provider.ts:80](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L80)

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`healthCheck`](/api/core/src/interfaces/provider/#healthcheck)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L110)

#### Parameters

##### options

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`send`](/api/core/src/interfaces/provider/#send)
