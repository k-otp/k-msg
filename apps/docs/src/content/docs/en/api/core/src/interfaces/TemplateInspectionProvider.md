---
editUrl: false
next: false
prev: false
title: "TemplateInspectionProvider"
---

Defined in: [packages/core/src/provider.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L119)

Interface for providers that support requesting template inspection.

## Methods

### requestTemplateInspection()

> **requestTemplateInspection**(`code`, `ctx?`): `Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>

Defined in: [packages/core/src/provider.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L123)

Request inspection for a template (submits for approval review).

#### Parameters

##### code

`string`

##### ctx?

[`TemplateContext`](/api/core/src/type-aliases/templatecontext/)

#### Returns

`Promise`\<[`Result`](/api/core/src/type-aliases/result/)\<`void`, [`KMsgError`](/api/core/src/classes/kmsgerror/)\>\>
