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

> **createTemplate**(`template`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L8)

#### Parameters

##### template

`Omit`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/), `"id"` \| `"metadata"`\>

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

***

### deleteTemplate()

> **deleteTemplate**(`templateId`): `Promise`\<`void`\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L65)

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`void`\>

***

### getTemplate()

> **getTemplate**(`templateId`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:39](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L39)

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`\>

***

### renderTemplate()

> **renderTemplate**(`templateId`, `variables`): `Promise`\<`string`\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L69)

#### Parameters

##### templateId

`string`

##### variables

`Record`\<`string`, `string` \| `number` \| `Date`\>

#### Returns

`Promise`\<`string`\>

***

### updateTemplate()

> **updateTemplate**(`templateId`, `updates`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

Defined in: [packages/template/src/toolkit/in-memory-template-store.ts:43](https://github.com/k-otp/k-msg/blob/main/packages/template/src/toolkit/in-memory-template-store.ts#L43)

#### Parameters

##### templateId

`string`

##### updates

`Partial`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>
