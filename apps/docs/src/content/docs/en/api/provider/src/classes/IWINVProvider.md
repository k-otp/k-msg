---
editUrl: false
next: false
prev: false
title: "IWINVProvider"
---

Defined in: [packages/provider/src/iwinv/provider.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L20)

Interface for providers that support AlimTalk template management.

## Extends

- [`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/)

## Implements

- [`TemplateProvider`](/api/core/src/interfaces/templateprovider/)

## Constructors

### Constructor

> **new IWINVProvider**(`config`): `IWINVProvider`

Defined in: packages/provider/src/iwinv/provider.send.ts:85

#### Parameters

##### config

[`IWINVConfig`](/api/provider/src/iwinv/interfaces/iwinvconfig/)

#### Returns

`IWINVProvider`

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`constructor`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#constructor)

## Properties

### id

> `readonly` **id**: `"iwinv"` = `"iwinv"`

Defined in: packages/provider/src/iwinv/provider.send.ts:67

Unique identifier for this provider instance.
Used for routing and logging.

#### Example

```ts
"solapi"
```

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`id`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#id)

***

### name

> `readonly` **name**: `"IWINV Messaging Provider"` = `"IWINV Messaging Provider"`

Defined in: packages/provider/src/iwinv/provider.send.ts:68

Human-readable name for display purposes.

#### Example

```ts
"SOLAPI"
```

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`name`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: packages/provider/src/iwinv/provider.send.ts:69

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`supportedTypes`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#supportedtypes)

## Methods

### createTemplate()

> **createTemplate**(`input`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L24)

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

Defined in: [packages/provider/src/iwinv/provider.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L49)

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

Defined in: packages/provider/src/iwinv/provider.send.ts:207

Query the remaining balance/points for the provider account.

#### Parameters

##### query?

[`BalanceQuery`](/api/core/src/interfaces/balancequery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`BalanceResult`](/api/core/src/interfaces/balanceresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`getBalance`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#getbalance)

***

### getDeliveryStatus()

> **getDeliveryStatus**(`query`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/provider/src/iwinv/provider.send.ts:178

Query delivery status for a previously sent message.
Optional capability - not all providers support this.

#### Parameters

##### query

[`DeliveryStatusQuery`](/api/core/src/interfaces/deliverystatusquery/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`getDeliveryStatus`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#getdeliverystatus)

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: packages/provider/src/iwinv/provider.send.ts:73

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`getOnboardingSpec`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L60)

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

Defined in: packages/provider/src/iwinv/provider.send.ts:110

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`healthCheck`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#healthcheck)

***

### listTemplates()

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L72)

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

Defined in: packages/provider/src/iwinv/provider.send.ts:145

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Inherited from

[`IWINVSendProvider`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/).[`send`](/api/provider/src/iwinv/send/classes/iwinvsendprovider/#send)

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/provider.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/provider.ts#L35)

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
