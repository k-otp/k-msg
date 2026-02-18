---
editUrl: false
next: false
prev: false
title: "MockProvider"
---

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:23](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L23)

## Implements

- [`Provider`](/api/core/src/interfaces/provider/)
- [`TemplateProvider`](/api/core/src/interfaces/templateprovider/)
- [`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/)
- [`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/)

## Constructors

### Constructor

> **new MockProvider**(): `MockProvider`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:64](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L64)

#### Returns

`MockProvider`

## Properties

### calls

> **calls**: [`SendOptions`](/api/core/src/type-aliases/sendoptions/)[] = `[]`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:49](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L49)

***

### id

> `readonly` **id**: `"mock"` = `"mock"`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:30](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L30)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`id`](/api/core/src/interfaces/provider/#id)

***

### name

> `readonly` **name**: `"Mock Provider"` = `"Mock Provider"`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:31](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L31)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`name`](/api/core/src/interfaces/provider/#name)

***

### supportedTypes

> `readonly` **supportedTypes**: readonly [`MessageType`](/api/core/src/type-aliases/messagetype/)[]

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:32](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L32)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`supportedTypes`](/api/core/src/interfaces/provider/#supportedtypes)

## Methods

### addKakaoChannel()

> **addKakaoChannel**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:312](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L312)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:146](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L146)

#### Returns

`void`

***

### createTemplate()

> **createTemplate**(`input`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:150](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L150)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:199](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L199)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:142](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L142)

#### Returns

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)[]

***

### getOnboardingSpec()

> **getOnboardingSpec**(): [`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:56](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L56)

#### Returns

[`ProviderOnboardingSpec`](/api/core/src/interfaces/provideronboardingspec/)

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`getOnboardingSpec`](/api/core/src/interfaces/provider/#getonboardingspec)

***

### getTemplate()

> **getTemplate**(`code`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:215](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L215)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:92](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L92)

#### Returns

`Promise`\<\{ `healthy`: `boolean`; `issues`: `never`[]; \}\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`healthCheck`](/api/core/src/interfaces/provider/#healthcheck)

***

### listKakaoChannelCategories()

> **listKakaoChannelCategories**(): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:279](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L279)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannelCategories`](/api/core/src/interfaces/kakaochannelcategories/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`KakaoChannelProvider`](/api/core/src/interfaces/kakaochannelprovider/).[`listKakaoChannelCategories`](/api/core/src/interfaces/kakaochannelprovider/#listkakaochannelcategories)

***

### listKakaoChannels()

> **listKakaoChannels**(`params?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`KakaoChannel`](/api/core/src/interfaces/kakaochannel/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:265](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L265)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:231](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L231)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:138](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L138)

#### Parameters

##### count

`number`

#### Returns

`void`

***

### mockSuccess()

> **mockSuccess**(): `void`

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:134](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L134)

#### Returns

`void`

***

### requestKakaoChannelAuth()

> **requestKakaoChannelAuth**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:296](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L296)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:250](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L250)

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

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:96](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L96)

#### Parameters

##### params

[`SendOptions`](/api/core/src/type-aliases/sendoptions/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`SendResult`](/api/core/src/interfaces/sendresult/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`Provider`](/api/core/src/interfaces/provider/).[`send`](/api/core/src/interfaces/provider/#send)

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `_ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/providers/mock/mock.provider.ts:172](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/provider/src/providers/mock/mock.provider.ts#L172)

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
