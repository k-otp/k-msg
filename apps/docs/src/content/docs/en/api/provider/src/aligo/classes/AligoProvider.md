---
editUrl: false
next: false
prev: false
title: "AligoProvider"
---

Defined in: [packages/provider/src/aligo/provider.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L22)

Aligo Provider package entrypoint

## Extends

- [`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/)

## Implements

- [`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/)
- [`TemplateInspectionProvider`](/en/api/core/src/interfaces/templateinspectionprovider/)

## Constructors

### Constructor

> **new AligoProvider**(`config`): `AligoProvider`

Defined in: [packages/provider/src/aligo/provider.send.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L60)

#### Parameters

##### config

[`AligoConfig`](/en/api/provider/src/aligo/interfaces/aligoconfig/)

#### Returns

`AligoProvider`

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`constructor`](/en/api/provider/src/aligo/send/classes/aligoprovider/#constructor)

## Properties

### id

> `readonly` **id**: `"aligo"` = `"aligo"`

Defined in: [packages/provider/src/aligo/provider.send.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L38)

Unique identifier for this provider instance.
Used for routing and logging.

#### Example

```ts
"solapi"
```

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`id`](/en/api/provider/src/aligo/send/classes/aligoprovider/#id)

***

### name

> `readonly` **name**: `"Aligo Smart SMS"` = `"Aligo Smart SMS"`

Defined in: [packages/provider/src/aligo/provider.send.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L39)

Human-readable name for display purposes.

#### Example

```ts
"SOLAPI"
```

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`name`](/en/api/provider/src/aligo/send/classes/aligoprovider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/en/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/aligo/provider.send.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L40)

Message types this provider supports.
Messages of unsupported types will be rejected.

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`supportedTypes`](/en/api/provider/src/aligo/send/classes/aligoprovider/#supportedtypes)

## Methods

### addKakaoChannel()

> **addKakaoChannel**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:150](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L150)

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

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`addKakaoChannel`](/en/api/provider/src/aligo/send/classes/aligoprovider/#addkakaochannel)

***

### createTemplate()

> **createTemplate**(`input`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L26)

Create a new template.

#### Parameters

##### input

[`TemplateCreateInput`](/en/api/core/src/type-aliases/templatecreateinput/)

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`createTemplate`](/en/api/core/src/interfaces/templateprovider/#createtemplate)

***

### deleteTemplate()

> **deleteTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L41)

Delete a template by code.

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`deleteTemplate`](/en/api/core/src/interfaces/templateprovider/#deletetemplate)

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/aligo/provider.send.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L52)

Get the onboarding specification for this provider.
Used by tooling to guide provider configuration.

#### Returns

[`ProviderOnboardingSpec`](/en/api/core/src/interfaces/provideronboardingspec/)

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`getOnboardingSpec`](/en/api/provider/src/aligo/send/classes/aligoprovider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L48)

Get a template by code.

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`getTemplate`](/en/api/core/src/interfaces/templateprovider/#gettemplate)

***

### healthCheck()

> **healthCheck**(): `Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

Defined in: [packages/provider/src/aligo/provider.send.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L85)

Check if the provider is operational.
Used for health monitoring and circuit breaker decisions.

#### Returns

`Promise`\<[`ProviderHealthStatus`](/en/api/core/src/interfaces/providerhealthstatus/)\>

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`healthCheck`](/en/api/provider/src/aligo/send/classes/aligoprovider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L137)

List available channel categories for registration.

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/en/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`listKakaoChannelCategories`](/en/api/provider/src/aligo/send/classes/aligoprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:130](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L130)

List registered Kakao channels.

#### Parameters

##### params?

###### plusId?

`string`

###### senderKey?

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/en/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`listKakaoChannels`](/en/api/provider/src/aligo/send/classes/aligoprovider/#listkakaochannels)

***

### listTemplates()

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L55)

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

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`listTemplates`](/en/api/core/src/interfaces/templateprovider/#listtemplates)

***

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:143](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L143)

Request authentication SMS for channel registration.

#### Parameters

##### params

###### phoneNumber

`string`

###### plusId

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`requestKakaoChannelAuth`](/en/api/provider/src/aligo/send/classes/aligoprovider/#requestkakaochannelauth)

***

### requestTemplateInspection()

> **requestTemplateInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L62)

Request inspection for a template (submits for approval review).

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateInspectionProvider`](/en/api/core/src/interfaces/templateinspectionprovider/).[`requestTemplateInspection`](/en/api/core/src/interfaces/templateinspectionprovider/#requesttemplateinspection)

***

### send()

> **send**(`options`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.send.ts:124](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.send.ts#L124)

Send a message through this provider.

#### Parameters

##### options

[`SendOptions`](/en/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`SendResult`](/en/api/core/src/interfaces/sendresult/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Result with SendResult on success, KMsgError on failure.

#### Inherited from

[`AligoProvider`](/en/api/provider/src/aligo/send/classes/aligoprovider/).[`send`](/en/api/provider/src/aligo/send/classes/aligoprovider/#send)

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/provider.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/provider.ts#L33)

Update an existing template by code.

#### Parameters

##### code

`string`

##### patch

[`TemplateUpdateInput`](/en/api/core/src/type-aliases/templateupdateinput/)

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`updateTemplate`](/en/api/core/src/interfaces/templateprovider/#updatetemplate)
