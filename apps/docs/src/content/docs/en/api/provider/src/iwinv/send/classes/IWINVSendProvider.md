---
editUrl: false
next: false
prev: false
title: "IWINVSendProvider"
---

Defined in: [packages/provider/src/iwinv/provider.send.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L66)

IWINV send/status/balance focused entrypoint.

## Extended by

- [`IWINVProvider`](/en/api/provider/src/classes/iwinvprovider/)

## Implements

- [`Provider`](/en/api/core/src/interfaces/provider/)
- [`BalanceProvider`](/en/api/core/src/interfaces/balanceprovider/)

## Constructors

### Constructor

> **new IWINVSendProvider**(`config`): `IWINVSendProvider`

Defined in: [packages/provider/src/iwinv/provider.send.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L85)

#### Parameters

##### config

[`IWINVConfig`](/en/api/provider/src/iwinv/interfaces/iwinvconfig/)

#### Returns

`IWINVSendProvider`

## Properties

### id

> `readonly` **id**: `"iwinv"` = `"iwinv"`

Defined in: [packages/provider/src/iwinv/provider.send.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L67)

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

> `readonly` **name**: `"IWINV Messaging Provider"` = `"IWINV Messaging Provider"`

Defined in: [packages/provider/src/iwinv/provider.send.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L68)

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

Defined in: [packages/provider/src/iwinv/provider.send.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L69)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`supportedTypes`](/en/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`BalanceResult`](/en/api/core/src/interfaces/balanceresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.send.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L207)

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

Defined in: [packages/provider/src/iwinv/provider.send.ts:178](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L178)

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

Defined in: [packages/provider/src/iwinv/provider.send.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L73)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/en/api/core/src/interfaces/provider/#getonboardingspec)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/iwinv/provider.send.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L110)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`healthCheck`](/en/api/core/src/interfaces/provider/#healthcheck)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.send.ts:145](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L145)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`send`](/en/api/core/src/interfaces/provider/#send)
