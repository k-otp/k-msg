---
editUrl: false
next: false
prev: false
title: "SolapiProvider"
---

Defined in: [packages/provider/src/solapi/provider.ts:27](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L27)

SOLAPI Provider package entrypoint

## Implements

- [`Provider`](/en/api/core/src/interfaces/provider/)
- [`BalanceProvider`](/en/api/core/src/interfaces/balanceprovider/)

## Constructors

### Constructor

> **new SolapiProvider**(`config`, `client?`): `SolapiProvider`

Defined in: [packages/provider/src/solapi/provider.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L62)

#### Parameters

##### config

[`SolapiConfig`](/en/api/provider/src/solapi/interfaces/solapiconfig/)

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

[`Provider`](/en/api/core/src/interfaces/provider/).[`id`](/en/api/core/src/interfaces/provider/#id)

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

[`Provider`](/en/api/core/src/interfaces/provider/).[`name`](/en/api/core/src/interfaces/provider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/solapi/provider.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L30)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`supportedTypes`](/en/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`BalanceResult`](/en/api/core/src/interfaces/balanceresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L145)

Query the remaining balance/points for the provider account.

#### Parameters

##### query?

[`BalanceQuery`](/en/api/core/src/interfaces/balancequery/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`BalanceResult`](/en/api/core/src/interfaces/balanceresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`BalanceProvider`](/en/api/core/src/interfaces/balanceprovider/).[`getBalance`](/en/api/core/src/interfaces/balanceprovider/#getbalance)

***

### getDeliveryStatus()

> **getDeliveryStatus**(`query`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L135)

Query delivery status for a previously sent message.
Optional capability - not all providers support this.

#### Parameters

##### query

[`DeliveryStatusQuery`](/en/api/core/src/interfaces/deliverystatusquery/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`getDeliveryStatus`](/en/api/core/src/interfaces/provider/#getdeliverystatus)

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/solapi/provider.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L50)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/en/api/core/src/interfaces/provider/#getonboardingspec)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/solapi/provider.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L89)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`healthCheck`](/en/api/core/src/interfaces/provider/#healthcheck)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/solapi/provider.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/solapi/provider.ts#L119)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`send`](/en/api/core/src/interfaces/provider/#send)
