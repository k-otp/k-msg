---
editUrl: false
next: false
prev: false
title: "TemplateLifecycleService"
---

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:33

## Constructors

### Constructor

> **new TemplateLifecycleService**(`provider`, `inspectionProvider?`): `TemplateLifecycleService`

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:36

#### Parameters

##### provider

[`TemplateProvider`](/api/core/src/interfaces/templateprovider/)

##### inspectionProvider?

[`TemplateInspectionProvider`](/api/core/src/interfaces/templateinspectionprovider/)

#### Returns

`TemplateLifecycleService`

## Methods

### create()

> **create**(`input`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:46

#### Parameters

##### input

[`TemplateCreateInput`](/api/core/src/type-aliases/templatecreateinput/)

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### delete()

> **delete**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:106

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### get()

> **get**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:122

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### list()

> **list**(`params?`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:138

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

***

### requestInspection()

> **requestInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:145

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

***

### update()

> **update**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: packages/template/src/runtime/template-lifecycle.service.ts:70

#### Parameters

##### code

`string`

##### patch

[`TemplateUpdateInput`](/api/core/src/type-aliases/templateupdateinput/)

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/), [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
