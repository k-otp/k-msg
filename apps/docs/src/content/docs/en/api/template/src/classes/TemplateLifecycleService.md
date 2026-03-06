---
editUrl: false
next: false
prev: false
title: "TemplateLifecycleService"
---

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L32)

## Constructors

### Constructor

> **new TemplateLifecycleService**(`provider`, `inspectionProvider?`): `TemplateLifecycleService`

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L35)

#### Parameters

##### provider

[`TemplateProvider`](/en/api/core/src/interfaces/templateprovider/)

##### inspectionProvider?

[`TemplateInspectionProvider`](/en/api/core/src/interfaces/templateinspectionprovider/)

#### Returns

`TemplateLifecycleService`

## Methods

### create()

> **create**(`input`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L45)

#### Parameters

##### input

[`TemplateCreateInput`](/en/api/core/src/type-aliases/templatecreateinput/)

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### delete()

> **delete**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L105)

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### get()

> **get**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L121)

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### list()

> **list**(`params?`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:137](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L137)

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

### requestInspection()

> **requestInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:144](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L144)

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

***

### update()

> **update**(`code`, `patch`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/template/src/runtime/template-lifecycle.service.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/template/src/runtime/template-lifecycle.service.ts#L69)

#### Parameters

##### code

`string`

##### patch

[`TemplateUpdateInput`](/en/api/core/src/type-aliases/templateupdateinput/)

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
