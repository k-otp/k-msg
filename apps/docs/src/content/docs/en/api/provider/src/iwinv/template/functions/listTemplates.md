---
editUrl: false
next: false
prev: false
title: "listTemplates"
---

> **listTemplates**(`params`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/provider/src/iwinv/iwinv.template.ts:404](https://github.com/k-otp/k-msg/blob/main/packages/provider/src/iwinv/iwinv.template.ts#L404)

## Parameters

### params

#### config

`NormalizedIwinvConfig`

#### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### providerId

`string`

#### query?

\{ `limit?`: `number`; `page?`: `number`; `status?`: `string`; \}

#### query.limit?

`number`

#### query.page?

`number`

#### query.status?

`string`

## Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<[`Template`](/api/core/src/interfaces/template/)[], [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
