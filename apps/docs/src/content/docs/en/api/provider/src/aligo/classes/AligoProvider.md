---
editUrl: false
next: false
prev: false
title: "AligoProvider"
---

Defined in: [packages/provider/src/aligo/provider.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L39)

Aligo Provider package entrypoint

## Implements

- [`Provider`](/api/core/src/interfaces/provider/)
- [`TemplateProvider`](/api/core/src/interfaces/templateprovider/)
- [`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/)
- [`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/)

## Constructors

### Constructor

> **new AligoProvider**(`config`): `AligoProvider`

Defined in: [packages/provider/src/aligo/provider.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L67)

#### Parameters

##### config

[`AligoConfig`](/api/provider/src/aligo/interfaces/aligoconfig/)

#### Returns

`AligoProvider`

## Properties

### id

> `readonly` **id**: `"aligo"` = `"aligo"`

Defined in: [packages/provider/src/aligo/provider.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L46)

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

> `readonly` **name**: `"Aligo Smart SMS"` = `"Aligo Smart SMS"`

Defined in: [packages/provider/src/aligo/provider.ts:47](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L47)

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

Defined in: [packages/provider/src/aligo/provider.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L48)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`supportedTypes`](/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### addKakaoChannel()

> **addKakaoChannel**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L156)

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

### createTemplate()

> **createTemplate**(`input`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:165](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L165)

Create a new template.

#### Parameters

##### input

[`TemplateCreateInput`](/api/core/src/type-aliases/templatecreateinput/)

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`createTemplate`](/api/core/src/interfaces/templateprovider/#createtemplate)

***

### deleteTemplate()

> **deleteTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:180](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L180)

Delete a template by code.

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/).[`deleteTemplate`](/api/core/src/interfaces/templateprovider/#deletetemplate)

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/aligo/provider.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L59)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/api/core/src/interfaces/provider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:187](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L187)

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

Defined in: [packages/provider/src/aligo/provider.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L91)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/api/core/src/interfaces/providerhealthstatus/)\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`healthCheck`](/api/core/src/interfaces/provider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:143](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L143)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannelCategories`](/api/core/src/interfaces/kakaochannelprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:136](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L136)

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

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:194](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L194)

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

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:149](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L149)

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

> **requestTemplateInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:201](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L201)

Request inspection for a template (submits for approval review).

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/).[`requestTemplateInspection`](/api/core/src/interfaces/templateinspectionprovider/#requesttemplateinspection)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L130)

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

Defined in: [packages/provider/src/aligo/provider.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L172)

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
