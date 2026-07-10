---
editUrl: false
next: false
prev: false
title: "InMemoryTemplateStore"
---

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:5](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L5)

## Constructors

### Constructor

> **new InMemoryTemplateStore**(): `InMemoryTemplateStore`

#### Returns

`InMemoryTemplateStore`

## Methods

### createTemplate()

> **createTemplate**(`template`): `Promise`\<\{ `buttons?`: `object`[]; `category`: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/); `code`: `string`; `content`: `string`; `id`: `string`; `metadata`: \{ `approvedAt?`: `Date`; `createdAt`: `Date`; `rejectedAt?`: `Date`; `rejectionReason?`: `string`; `updatedAt`: `Date`; `usage`: \{ `delivered`: `number`; `failed`: `number`; `sent`: `number`; \}; \}; `name`: `string`; `provider`: `string`; `status`: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/); `variables?`: `object`[]; \}\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L8)

#### Parameters

##### template

`Omit`\<[`AlimTalkTemplate`](/en/api/template/src/type-aliases/alimtalktemplate/), `"id"` \| `"metadata"`\>

#### Returns

`Promise`\<\{ `buttons?`: `object`[]; `category`: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/); `code`: `string`; `content`: `string`; `id`: `string`; `metadata`: \{ `approvedAt?`: `Date`; `createdAt`: `Date`; `rejectedAt?`: `Date`; `rejectionReason?`: `string`; `updatedAt`: `Date`; `usage`: \{ `delivered`: `number`; `failed`: `number`; `sent`: `number`; \}; \}; `name`: `string`; `provider`: `string`; `status`: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/); `variables?`: `object`[]; \}\>

***

### deleteTemplate()

> **deleteTemplate**(`templateId`): `Promise`\<`void`\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L70)

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`void`\>

***

### getTemplate()

> **getTemplate**(`templateId`): `Promise`\<\{ `buttons?`: `object`[]; `category`: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/); `code`: `string`; `content`: `string`; `id`: `string`; `metadata`: \{ `approvedAt?`: `Date`; `createdAt`: `Date`; `rejectedAt?`: `Date`; `rejectionReason?`: `string`; `updatedAt`: `Date`; `usage`: \{ `delivered`: `number`; `failed`: `number`; `sent`: `number`; \}; \}; `name`: `string`; `provider`: `string`; `status`: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/); `variables?`: `object`[]; \} \| `null`\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L39)

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<\{ `buttons?`: `object`[]; `category`: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/); `code`: `string`; `content`: `string`; `id`: `string`; `metadata`: \{ `approvedAt?`: `Date`; `createdAt`: `Date`; `rejectedAt?`: `Date`; `rejectionReason?`: `string`; `updatedAt`: `Date`; `usage`: \{ `delivered`: `number`; `failed`: `number`; `sent`: `number`; \}; \}; `name`: `string`; `provider`: `string`; `status`: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/); `variables?`: `object`[]; \} \| `null`\>

***

### renderTemplate()

> **renderTemplate**(`templateId`, `variables`): `Promise`\<`string`\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L74)

#### Parameters

##### templateId

`string`

##### variables

`Record`\<`string`, `string` \| `number` \| `Date`\>

#### Returns

`Promise`\<`string`\>

***

### updateTemplate()

> **updateTemplate**(`templateId`, `updates`): `Promise`\<\{ `buttons?`: `object`[]; `category`: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/); `code`: `string`; `content`: `string`; `id`: `string`; `metadata`: \{ `approvedAt?`: `Date`; `createdAt`: `Date`; `rejectedAt?`: `Date`; `rejectionReason?`: `string`; `updatedAt`: `Date`; `usage`: \{ `delivered`: `number`; `failed`: `number`; `sent`: `number`; \}; \}; `name`: `string`; `provider`: `string`; `status`: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/); `variables?`: `object`[]; \}\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L43)

#### Parameters

##### templateId

`string`

##### updates

`Partial`\<[`AlimTalkTemplate`](/en/api/template/src/type-aliases/alimtalktemplate/)\>

#### Returns

`Promise`\<\{ `buttons?`: `object`[]; `category`: [`TemplateCategory`](/en/api/template/src/enumerations/templatecategory/); `code`: `string`; `content`: `string`; `id`: `string`; `metadata`: \{ `approvedAt?`: `Date`; `createdAt`: `Date`; `rejectedAt?`: `Date`; `rejectionReason?`: `string`; `updatedAt`: `Date`; `usage`: \{ `delivered`: `number`; `failed`: `number`; `sent`: `number`; \}; \}; `name`: `string`; `provider`: `string`; `status`: [`TemplateStatus`](/en/api/template/src/enumerations/templatestatus/); `variables?`: `object`[]; \}\>
