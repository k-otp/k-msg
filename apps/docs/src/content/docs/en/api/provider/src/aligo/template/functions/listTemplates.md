---
editUrl: false
next: false
prev: false
title: "listTemplates"
---

> **listTemplates**(`ctx`, `params?`, `templateCtx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/aligo.template.ts:315](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/aligo.template.ts#L315)

Aligo template CRUD focused entrypoint.

## Parameters

### ctx

`AligoRuntimeContext`

### params?

#### limit?

`number`

#### page?

`number`

#### status?

`string`

### templateCtx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

## Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/)[], [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
