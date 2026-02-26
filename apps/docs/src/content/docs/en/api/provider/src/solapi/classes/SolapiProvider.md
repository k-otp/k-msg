---
editUrl: false
next: false
prev: false
title: "SolapiProvider"
---

Defined in: [packages/provider/src/solapi/provider.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L27)

SOLAPI Provider package entrypoint

## Implements

- [`Provider`](/api/core/src/interfaces/provider/)
- [`BalanceProvider`](/api/core/src/interfaces/balanceprovider/)

## Constructors

### Constructor

> **new SolapiProvider**(`config`, `client?`): `SolapiProvider`

Defined in: [packages/provider/src/solapi/provider.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L62)

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

Defined in: [packages/provider/src/solapi/provider.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L28)

Unique identifier for this provider instance.
Used for routing and logging.

#### Example

```ts
"solapi"
```

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`id`](/api/core/src/interfaces/provider/#id)

***

### name

> `readonly` **name**: `"SOLAPI Messaging Provider"` = `"SOLAPI Messaging Provider"`

Defined in: [packages/provider/src/solapi/provider.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L29)

Human-readable name for display purposes.

#### Example

```ts
"SOLAPI"
```

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`name`](/api/core/src/interfaces/provider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/solapi/provider.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L30)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`supportedTypes`](/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L145)

Query the remaining balance/points for the provider account.

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

Defined in: [packages/provider/src/solapi/provider.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L135)

Query delivery status for a previously sent message.
Optional capability - not all providers support this.

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

Defined in: [packages/provider/src/solapi/provider.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L50)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/api/core/src/interfaces/provider/#getonboardingspec)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/solapi/provider.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L89)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`healthCheck`](/api/core/src/interfaces/provider/#healthcheck)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L119)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`send`](/api/core/src/interfaces/provider/#send)
