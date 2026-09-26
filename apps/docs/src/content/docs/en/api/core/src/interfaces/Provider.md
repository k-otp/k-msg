---
editUrl: false
next: false
prev: false
title: "Provider"
---

Defined in: [packages/core/src/provider.ts:241](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L241)

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

Defined in: [packages/core/src/provider.ts:247](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L247)

Unique identifier for this provider instance.
Used for routing and logging.

#### Example

```ts
"solapi"
```

***

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/provider.ts:252](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L252)

Human-readable name for display purposes.

#### Example

```ts
"SOLAPI"
```

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/core/src/provider.ts:257](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L257)

Message types this provider supports.
Messages of unsupported types will be rejected.

***

### transportCapabilities?

> `readonly` `optional` **transportCapabilities?**: [`ProviderTransportCapabilities`](/en/api/core/src/interfaces/providertransportcapabilities/)

Defined in: [packages/core/src/provider.ts:262](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L262)

Per-operation transport features supported by this provider.
Missing declarations must be treated as unsupported.

## Methods

### getDeliveryStatus()?

> `optional` **getDeliveryStatus**(`query`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:281](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L281)

Query delivery status for a previously sent message.
Optional capability - not all providers support this.

#### Parameters

##### query

[`DeliveryStatusQuery`](/en/api/core/src/interfaces/deliverystatusquery/)

##### context?

[`ProviderRequestContext`](/en/api/core/src/interfaces/providerrequestcontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### getOnboardingSpec()?

> `optional` **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/core/src/provider.ts:289](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L289)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/core/src/provider.ts:268](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L268)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

***

### send()

> **send**(`params`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:273](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L273)

Send a message through this provider.

#### Parameters

##### params

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

##### context?

[`ProviderRequestContext`](/en/api/core/src/interfaces/providerrequestcontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.
