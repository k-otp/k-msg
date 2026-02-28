---
editUrl: false
next: false
prev: false
title: "AligoTemplateProvider"
---

Defined in: packages/provider/src/aligo/provider.template.ts:23

Aligo template CRUD focused entrypoint.

## Implements

- [`TemplateProvider`](/api/core/src/interfaces/templateprovider/)
- [`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/)

## Constructors

### Constructor

> **new AligoTemplateProvider**(`config`): `AligoTemplateProvider`

Defined in: packages/provider/src/aligo/provider.template.ts:32

#### Parameters

##### config

[`AligoConfig`](/api/provider/src/aligo/interfaces/aligoconfig/)

#### Returns

`AligoTemplateProvider`

## Properties

### id

> `readonly` **id**: `"aligo"` = `"aligo"`

Defined in: packages/provider/src/aligo/provider.template.ts:26

## Methods

### createTemplate()

> **createTemplate**(`input`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/provider/src/aligo/provider.template.ts:57

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

Defined in: packages/provider/src/aligo/provider.template.ts:72

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

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/provider/src/aligo/provider.template.ts:79

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

### listTemplates()

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/provider/src/aligo/provider.template.ts:86

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

### requestTemplateInspection()

> **requestTemplateInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/provider/src/aligo/provider.template.ts:93

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

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/provider/src/aligo/provider.template.ts:64

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
