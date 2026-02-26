---
editUrl: false
next: false
prev: false
title: "MockProvider"
---

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L62)

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
- [`TemplateProvider`](/api/core/src/interfaces/templateprovider/)
- [`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/)
- [`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/)

## Constructors

### Constructor

> **new MockProvider**(): `MockProvider`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L105)

#### Returns

`MockProvider`

## Properties

### calls

> **calls**: [`SendOptions`](/api/core/src/type-aliases/sendoptions/)[] = `[]`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L88)

***

### id

> `readonly` **id**: `"mock"` = `"mock"`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L69)

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

> `readonly` **name**: `"Mock Provider"` = `"Mock Provider"`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L70)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L71)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`supportedTypes`](/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### addKakaoChannel()

> **addKakaoChannel**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:425](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L425)

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

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/).[`addKakaoChannel`](/api/core/src/interfaces/kakaochannelprovider/#addkakaochannel)

***

### clearHistory()

> **clearHistory**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:259](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L259)

#### Returns

`void`

***

### clearScenario()

> **clearScenario**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:231](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L231)

#### Returns

`void`

***

### createTemplate()

> **createTemplate**(`input`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:263](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L263)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:312](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L312)

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

### getHistory()

> **getHistory**(): [`SendOptions`](/api/core/src/type-aliases/sendoptions/)[]

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:255](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L255)

#### Returns

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)[]

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:97](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L97)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/api/core/src/interfaces/provider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:328](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L328)

Get a template by code.

#### Parameters

##### code

`string`

##### \_ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`getTemplate`](/api/core/src/interfaces/templateprovider/#gettemplate)

***

### healthCheck()

> **healthCheck**(): `Promise`\<\{ `healthy`: `boolean`; `issues`: `never`[]; \}\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:133](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L133)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<\{ `healthy`: `boolean`; `issues`: `never`[]; \}\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`healthCheck`](/api/core/src/interfaces/provider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:392](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L392)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannelCategories`](/api/core/src/interfaces/kakaochannelprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:378](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L378)

List registered Kakao channels.

#### Parameters

##### params?

###### plusId?

`string`

###### senderKey?

`string`

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannels`](/api/core/src/interfaces/kakaochannelprovider/#listkakaochannels)

***

### listTemplates()

> **listTemplates**(`params?`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:344](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L344)

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

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`listTemplates`](/api/core/src/interfaces/templateprovider/#listtemplates)

***

### mockFailure()

> **mockFailure**(`count`): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:221](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L221)

#### Parameters

##### count

`number`

#### Returns

`void`

***

### mockScenario()

> **mockScenario**(`steps`): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:226](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L226)

#### Parameters

##### steps

`MockSendScenarioStep`[]

#### Returns

`void`

***

### mockSuccess()

> **mockSuccess**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:216](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L216)

#### Returns

`void`

***

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:409](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L409)

Request authentication SMS for channel registration.

#### Parameters

##### params

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/).[`requestKakaoChannelAuth`](/api/core/src/interfaces/kakaochannelprovider/#requestkakaochannelauth)

***

### requestTemplateInspection()

> **requestTemplateInspection**(`code`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:363](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L363)

Request inspection for a template (submits for approval review).

#### Parameters

##### code

`string`

##### \_ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/).[`requestTemplateInspection`](/api/core/src/interfaces/templateinspectionprovider/#requesttemplateinspection)

***

### send()

> **send**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L137)

Send a message through this provider.

#### Parameters

##### params

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`send`](/api/core/src/interfaces/provider/#send)

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:285](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/providers/mock/mock.provider.ts#L285)

Update an existing template by code.

#### Parameters

##### code

`string`

##### patch

[`TemplateUpdateInput`](/api/core/src/type-aliases/templateupdateinput/)

##### \_ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`updateTemplate`](/api/core/src/interfaces/templateprovider/#updatetemplate)
