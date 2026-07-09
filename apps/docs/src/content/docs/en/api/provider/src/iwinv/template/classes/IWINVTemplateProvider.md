---
editUrl: false
next: false
prev: false
title: "IWINVTemplateProvider"
---

Defined in: [packages/provider/src/iwinv/template.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L31)

Interface for providers that support AlimTalk template management.

## Implements

- [`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/)

## Constructors

### Constructor

> **new IWINVTemplateProvider**(`config`): `IWINVTemplateProvider`

Defined in: [packages/provider/src/iwinv/template.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L36)

#### Parameters

##### config

[`IWINVConfig`](/en/api/provider/src/iwinv/interfaces/iwinvconfig/)

#### Returns

`IWINVTemplateProvider`

## Properties

### id

> `readonly` **id**: `"iwinv"` = `"iwinv"`

Defined in: [packages/provider/src/iwinv/template.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L32)

## Methods

### createTemplate()

> **createTemplate**(`input`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/template.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L55)

Create a new template.

#### Parameters

##### input

[`TemplateCreateInput`](/en/api/core/src/type-aliases/templatecreateinput/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`createTemplate`](/en/api/core/src/interfaces/templateprovider/#createtemplate)

***

### deleteTemplate()

> **deleteTemplate**(`code`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/template.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L79)

Delete a template by code.

#### Parameters

##### code

`string`

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

#### Implementation of

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/).[`deleteTemplate`](/en/api/core/src/interfaces/templateprovider/#deletetemplate)

***

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/template.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L87)

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

### listTemplates()

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/template.ts:99](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L99)

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

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/template.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/template.ts#L65)

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
