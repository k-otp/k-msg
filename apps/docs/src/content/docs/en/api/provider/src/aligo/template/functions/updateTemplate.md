---
editUrl: false
next: false
prev: false
title: "updateTemplate"
---

> **updateTemplate**(`ctx`, `code`, `patch`, `templateCtx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/aligo/aligo.template.ts:181](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/aligo/aligo.template.ts#L181)

Aligo template CRUD focused entrypoint.

## Parameters

### ctx

`AligoRuntimeContext`

### code

`string`

### patch

[`TemplateUpdateInput`](/en/api/core/src/type-aliases/templateupdateinput/)

### templateCtx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

## Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<[`Template`](/en/api/core/src/interfaces/template/), [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
