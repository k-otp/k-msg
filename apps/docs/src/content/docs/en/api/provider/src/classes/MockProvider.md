---
editUrl: false
next: false
prev: false
title: "MockProvider"
---

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L89)

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

> **new MockProvider**(): `MockProvider`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L136)

#### Returns

`MockProvider`

## Properties

### calls

> **calls**: [`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)[] = `[]`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L119)

***

### id

> `readonly` **id**: `"mock"` = `"mock"`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L96)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L97)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:98](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L98)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`supportedTypes`](/en/api/core/src/interfaces/provider/#supportedtypes)

***

### transportCapabilities

> `readonly` **transportCapabilities**: `object`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L114)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:482](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L482)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:316](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L316)

#### Returns

`void`

***

### clearScenario()

> **clearScenario**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:276](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L276)

#### Returns

`void`

***

### createTemplate()

> **createTemplate**(`input`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:320](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L320)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:369](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L369)

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

### getHistory()

> **getHistory**(): [`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)[]

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:312](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L312)

#### Returns

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)[]

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:128](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L128)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/en/api/core/src/interfaces/provider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:385](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L385)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:164](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L164)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<\{ `healthy`: `boolean`; `issues`: `never`[]; \}\>

#### Implementation of

[`Provider`](/en/api/core/src/interfaces/provider/).[`healthCheck`](/en/api/core/src/interfaces/provider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:449](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L449)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/en/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:435](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L435)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:401](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L401)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:266](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L266)

#### Parameters

##### count

`number`

#### Returns

`void`

***

### mockScenario()

> **mockScenario**(`steps`): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:271](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L271)

#### Parameters

##### steps

`MockSendScenarioStep`[]

#### Returns

`void`

***

### mockSuccess()

> **mockSuccess**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:261](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L261)

#### Returns

`void`

***

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:466](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L466)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:420](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L420)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:168](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L168)

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

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `_ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:342](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L342)

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
