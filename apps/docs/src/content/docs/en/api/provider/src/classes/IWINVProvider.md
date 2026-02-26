---
editUrl: false
next: false
prev: false
title: "IWINVProvider"
---

Defined in: [packages/provider/src/iwinv/provider.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L54)

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

## Implements

- [`Provider`](/api/core/src/interfaces/provider/)
- [`BalanceProvider`](/api/core/src/interfaces/balanceprovider/)
- [`TemplateProvider`](/api/core/src/interfaces/templateprovider/)

## Constructors

### Constructor

> **new IWINVProvider**(`config`): `IWINVProvider`

Defined in: [packages/provider/src/iwinv/provider.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L75)

#### Parameters

##### config

[`IWINVConfig`](/api/provider/src/iwinv/interfaces/iwinvconfig/)

#### Returns

`IWINVProvider`

## Properties

### id

> `readonly` **id**: `"iwinv"` = `"iwinv"`

Defined in: [packages/provider/src/iwinv/provider.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L57)

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

> `readonly` **name**: `"IWINV Messaging Provider"` = `"IWINV Messaging Provider"`

Defined in: [packages/provider/src/iwinv/provider.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L58)

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

Defined in: [packages/provider/src/iwinv/provider.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L59)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`supportedTypes`](/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### createTemplate()

> **createTemplate**(`input`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:403](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L403)

Create a new template.

#### Parameters

##### input

[`TemplateCreateInput`](/api/core/src/type-aliases/templatecreateinput/)

##### \_ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`createTemplate`](/api/core/src/interfaces/templateprovider/#createtemplate)

***

### deleteTemplate()

> **deleteTemplate**(`code`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:428](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L428)

Delete a template by code.

#### Parameters

##### code

`string`

##### \_ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`deleteTemplate`](/api/core/src/interfaces/templateprovider/#deletetemplate)

***

### getBalance()

> **getBalance**(`query?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:201](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L201)

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

Defined in: [packages/provider/src/iwinv/provider.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L172)

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

Defined in: [packages/provider/src/iwinv/provider.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L63)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/api/core/src/interfaces/provider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:439](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L439)

Get a template by code.

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`getTemplate`](/api/core/src/interfaces/templateprovider/#gettemplate)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/iwinv/provider.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L104)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`healthCheck`](/api/core/src/interfaces/provider/#healthcheck)

***

### listTemplates()

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:451](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L451)

List templates with optional filtering and pagination.

#### Parameters

##### params?

###### limit?

`number`

###### page?

`number`

###### status?

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`listTemplates`](/api/core/src/interfaces/templateprovider/#listtemplates)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:139](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L139)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`send`](/api/core/src/interfaces/provider/#send)

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:414](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L414)

Update an existing template by code.

#### Parameters

##### code

`string`

##### patch

[`TemplateUpdateInput`](/api/core/src/type-aliases/templateupdateinput/)

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`updateTemplate`](/api/core/src/interfaces/templateprovider/#updatetemplate)
