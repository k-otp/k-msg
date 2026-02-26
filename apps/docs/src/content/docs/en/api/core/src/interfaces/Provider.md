---
editUrl: false
next: false
prev: false
title: "Provider"
---

Defined in: [packages/core/src/provider.ts:206](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L206)

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

## Properties

### id

> `readonly` **id**: `string`

Defined in: [packages/core/src/provider.ts:212](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L212)

Unique identifier for this provider instance.
Used for routing and logging.

#### Example

```ts
"solapi"
```

***

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/provider.ts:217](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L217)

Human-readable name for display purposes.

#### Example

```ts
"SOLAPI"
```

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/core/src/provider.ts:222](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L222)

Message types this provider supports.
Messages of unsupported types will be rejected.

## Methods

### getDeliveryStatus()?

> `optional` **getDeliveryStatus**(`query`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:238](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L238)

Query delivery status for a previously sent message.
Optional capability - not all providers support this.

#### Parameters

##### query

[`DeliveryStatusQuery`](/api/core/src/interfaces/deliverystatusquery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### getOnboardingSpec()?

> `optional` **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/core/src/provider.ts:245](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L245)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/core/src/provider.ts:228](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L228)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

***

### send()

> **send**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:233](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L233)

Send a message through this provider.

#### Parameters

##### params

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.
