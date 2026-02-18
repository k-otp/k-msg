---
editUrl: false
next: false
prev: false
title: "MockTemplateService"
---

Defined in: [packages/template/src/services/template.service.ts:10](https://github.com/k-otp/k-msg/blob/main/packages/template/src/services/template.service.ts#L10)

## Constructors

### Constructor

> **new MockTemplateService**(): `TemplateService`

#### Returns

`TemplateService`

## Methods

### createTemplate()

> **createTemplate**(`template`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

Defined in: [packages/template/src/services/template.service.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/template/src/services/template.service.ts#L13)

#### Parameters

##### template

`Omit`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/), `"id"` \| `"metadata"`\>

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

***

### deleteTemplate()

> **deleteTemplate**(`templateId`): `Promise`\<`void`\>

Defined in: [packages/template/src/services/template.service.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/template/src/services/template.service.ts#L71)

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`void`\>

***

### getTemplate()

> **getTemplate**(`templateId`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`\>

Defined in: [packages/template/src/services/template.service.ts:45](https://github.com/k-otp/k-msg/blob/main/packages/template/src/services/template.service.ts#L45)

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/) \| `null`\>

***

### renderTemplate()

> **renderTemplate**(`templateId`, `variables`): `Promise`\<`string`\>

Defined in: [packages/template/src/services/template.service.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/template/src/services/template.service.ts#L75)

#### Parameters

##### templateId

`string`

##### variables

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<`string`\>

***

### updateTemplate()

> **updateTemplate**(`templateId`, `updates`): `Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

Defined in: [packages/template/src/services/template.service.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/template/src/services/template.service.ts#L49)

#### Parameters

##### templateId

`string`

##### updates

`Partial`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

#### Returns

`Promise`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>
