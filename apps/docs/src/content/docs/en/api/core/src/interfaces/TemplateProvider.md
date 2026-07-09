---
editUrl: false
next: false
prev: false
title: "TemplateProvider"
---

Defined in: [packages/core/src/provider.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L77)

Interface for providers that support AlimTalk template management.

## Methods

### createTemplate()

> **createTemplate**(`input`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L81)

Create a new template.

#### Parameters

##### input

[`TemplateCreateInput`](/en/api/core/src/type-aliases/templatecreateinput/)

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### deleteTemplate()

> **deleteTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:96](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L96)

Delete a template by code.

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### getTemplate()

> **getTemplate**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:103](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L103)

Get a template by code.

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### listTemplates()

> **listTemplates**(`params?`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L110)

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

***

### updateTemplate()

> **updateTemplate**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L88)

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
