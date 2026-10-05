---
editUrl: false
next: false
prev: false
title: "IWINVSendProvider"
---

Defined in: [packages/provider/src/iwinv/provider.send.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L60)

Core provider interface for sending messages.

All providers must implement this interface. Optional capabilities
(balance, templates, delivery status) are exposed via separate interfaces.

## Example

```ts
class MyProvider implements Provider {
  readonly id = "my-provider";
  readonly name = "My Provider";
  readonly supportedTypes = ["SMS", "LMS"] as const;

  async healthCheck() { return { healthy: true, issues: [] }; }
  async send(params) { ... }
}
```

## Extended by

- [`IWINVProvider`](/en/api/provider/src/classes/iwinvprovider/)

## Implements

- [`Provider`](/en/api/core/src/interfaces/provider/)
- [`BalanceProvider`](/en/api/core/src/interfaces/balanceprovider/)

## Constructors

### Constructor

> **new IWINVSendProvider**(`config`): `IWINVSendProvider`

Defined in: [packages/provider/src/iwinv/provider.send.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L77)

#### Parameters

##### config

[`IWINVConfig`](/en/api/provider/src/iwinv/interfaces/iwinvconfig/)

#### Returns

`IWINVSendProvider`

## Properties

### id

> `readonly` **id**: `"iwinv"` = `"iwinv"`

Defined in: [packages/provider/src/iwinv/provider.send.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L61)

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

Defined in: [packages/provider/src/iwinv/provider.send.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L62)

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

Defined in: [packages/provider/src/iwinv/provider.send.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L63)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`supportedTypes`](/en/api/core/src/interfaces/provider/#supportedtypes)

***

### transportCapabilities

> `readonly` **transportCapabilities**: `object`

Defined in: [packages/provider/src/iwinv/provider.send.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L64)

Per-operation transport features supported by this provider.
Missing declarations must be treated as unsupported.

#### abortSignal

> `readonly` **abortSignal**: `"supported"` = `"supported"`

#### injectableFetch

> `readonly` **injectableFetch**: `"supported"` = `"supported"`

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`transportCapabilities`](/en/api/core/src/interfaces/provider/#transportcapabilities)

## Methods

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`BalanceResult`](/en/api/core/src/interfaces/balanceresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.send.ts:218](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L218)

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

> **getDeliveryStatus**(`query`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.send.ts:179](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L179)

Query delivery status for a previously sent message.
Optional capability - not all providers support this.

#### Parameters

##### query

[`DeliveryStatusQuery`](/en/api/core/src/interfaces/deliverystatusquery/)

##### context?

[`ProviderRequestContext`](/en/api/core/src/interfaces/providerrequestcontext/)

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

Defined in: [packages/provider/src/iwinv/provider.send.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L98)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`healthCheck`](/en/api/core/src/interfaces/provider/#healthcheck)

***

### send()

> **send**(`options`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.send.ts:133](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.send.ts#L133)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

##### context?

[`ProviderRequestContext`](/en/api/core/src/interfaces/providerrequestcontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`send`](/en/api/core/src/interfaces/provider/#send)
