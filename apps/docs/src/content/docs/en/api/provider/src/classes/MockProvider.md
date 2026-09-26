---
editUrl: false
next: false
prev: false
title: "MockProvider"
---

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:101](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L101)

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

- [`Provider`](/en/api/core/src/interfaces/provider/)
- [`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/)
- [`TemplateInspectionProvider`](/en/api/core/src/interfaces/templateinspectionprovider/)
- [`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/)

## Constructors

### Constructor

> **new MockProvider**(`options?`): `MockProvider`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L150)

#### Parameters

##### options?

[`MockProviderOptions`](/en/api/provider/src/interfaces/mockprovideroptions/) = `{}`

#### Returns

`MockProvider`

## Properties

### calls

> **calls**: [`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)[] = `[]`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L131)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L108)

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

> `readonly` **name**: `"Mock Provider"` = `"Mock Provider"`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L109)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L110)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`supportedTypes`](/en/api/core/src/interfaces/provider/#supportedtypes)

***

### transportCapabilities

> `readonly` **transportCapabilities**: `object`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L126)

Per-operation transport features supported by this provider.
Missing declarations must be treated as unsupported.

#### abortSignal

> `readonly` **abortSignal**: `"supported"` = `"supported"`

#### injectableFetch

> `readonly` **injectableFetch**: `"unsupported"` = `"unsupported"`

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`transportCapabilities`](/en/api/core/src/interfaces/provider/#transportcapabilities)

## Methods

### addKakaoChannel()

> **addKakaoChannel**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:568](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L568)

Add a Kakao channel after authentication.

#### Parameters

##### params

###### authNum

`string`

###### categoryCode

`string`

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`addKakaoChannel`](/en/api/core/src/interfaces/kakaochannelprovider/#addkakaochannel)

***

### clearHistory()

> **clearHistory**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:401](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L401)

#### Returns

`void`

***

### clearScenario()

> **clearScenario**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:310](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L310)

#### Returns

`void`

***

### createTemplate()

> **createTemplate**(`input`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:406](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L406)

Create a new template.

#### Parameters

##### input

[`TemplateCreateInput`](/en/api/core/src/type-aliases/templatecreateinput/)

##### \_ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`createTemplate`](/en/api/core/src/interfaces/templateprovider/#createtemplate)

***

### deleteTemplate()

> **deleteTemplate**(`code`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:455](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L455)

Delete a template by code.

#### Parameters

##### code

`string`

##### \_ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`deleteTemplate`](/en/api/core/src/interfaces/templateprovider/#deletetemplate)

***

### getDeliveryStatus()

> **getDeliveryStatus**(`query`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/) \| `null`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:320](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L320)

Reports the status of a message this provider sent. Sent messages read
as DELIVERED until [setDeliveryStatus](/en/api/provider/src/classes/mockprovider/#setdeliverystatus) changes them; an unknown
`providerMessageId` reads as not found.

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

### getHistory()

> **getHistory**(): [`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)[]

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:397](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L397)

#### Returns

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)[]

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:141](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L141)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/en/api/core/src/interfaces/provider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:471](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L471)

Get a template by code.

#### Parameters

##### code

`string`

##### \_ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`getTemplate`](/en/api/core/src/interfaces/templateprovider/#gettemplate)

***

### healthCheck()

> **healthCheck**(): `Promise`\<\{ `healthy`: `boolean`; `issues`: `never`[]; \}\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:186](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L186)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<\{ `healthy`: `boolean`; `issues`: `never`[]; \}\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`healthCheck`](/en/api/core/src/interfaces/provider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:535](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L535)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:521](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L521)

List registered Kakao channels.

#### Parameters

##### params?

###### plusId?

`string`

###### senderKey?

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannels`](/en/api/core/src/interfaces/kakaochannelprovider/#listkakaochannels)

***

### listTemplates()

> **listTemplates**(`params?`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:487](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L487)

List templates with optional filtering and pagination.

#### Parameters

##### params?

###### limit?

`number`

###### page?

`number`

###### status?

`string`

##### \_ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`listTemplates`](/en/api/core/src/interfaces/templateprovider/#listtemplates)

***

### mockFailure()

> **mockFailure**(`count`): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:300](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L300)

#### Parameters

##### count

`number`

#### Returns

`void`

***

### mockScenario()

> **mockScenario**(`steps`): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:305](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L305)

#### Parameters

##### steps

`MockSendScenarioStep`[]

#### Returns

`void`

***

### mockSuccess()

> **mockSuccess**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:295](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L295)

#### Returns

`void`

***

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:552](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L552)

Request authentication SMS for channel registration.

#### Parameters

##### params

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`requestKakaoChannelAuth`](/en/api/core/src/interfaces/kakaochannelprovider/#requestkakaochannelauth)

***

### requestTemplateInspection()

> **requestTemplateInspection**(`code`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:506](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L506)

Request inspection for a template (submits for approval review).

#### Parameters

##### code

`string`

##### \_ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateInspectionProvider`](/en/api/core/src/interfaces/templateinspectionprovider/).[`requestTemplateInspection`](/en/api/core/src/interfaces/templateinspectionprovider/#requesttemplateinspection)

***

### send()

> **send**(`params`, `context?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:190](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L190)

Send a message through this provider.

#### Parameters

##### params

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

##### context?

[`ProviderRequestContext`](/en/api/core/src/interfaces/providerrequestcontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`send`](/en/api/core/src/interfaces/provider/#send)

***

### setDeliveryStatus()

> **setDeliveryStatus**(`providerMessageId`, `status`, `details?`): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:340](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L340)

Sets what [getDeliveryStatus](/en/api/provider/src/classes/mockprovider/#getdeliverystatus) reports for a message this provider
sent, for example `FAILED` with a provider status code to exercise
failure paths. Throws for an id it did not send, so a typo in a test
fails loudly.

#### Parameters

##### providerMessageId

`string`

##### status

[`DeliveryStatus`](/en/api/core/src/type-aliases/deliverystatus/)

##### details?

`Pick`\<[`DeliveryStatusResult`](/en/api/core/src/interfaces/deliverystatusresult/), `"statusCode"` \| `"statusMessage"` \| `"raw"`\> = `{}`

#### Returns

`void`

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:428](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L428)

Update an existing template by code.

#### Parameters

##### code

`string`

##### patch

[`TemplateUpdateInput`](/en/api/core/src/type-aliases/templateupdateinput/)

##### \_ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`updateTemplate`](/en/api/core/src/interfaces/templateprovider/#updatetemplate)
