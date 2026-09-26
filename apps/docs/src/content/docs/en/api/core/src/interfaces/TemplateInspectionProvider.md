---
editUrl: false
next: false
prev: false
title: "TemplateInspectionProvider"
---

Defined in: [packages/core/src/provider.ts:155](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L155)

Interface for providers that support requesting template inspection.

## Methods

### requestTemplateInspection()

> **requestTemplateInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:159](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L159)

Request inspection for a template (submits for approval review).

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/en/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/en/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/en/api/core/src/classes/kmsgerror/)\>\>
