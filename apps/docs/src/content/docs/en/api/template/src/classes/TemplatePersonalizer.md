---
editUrl: false
next: false
prev: false
title: "TemplatePersonalizer"
---

Defined in: [packages/template/src/personalization/variable.replacer.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L75)

## Constructors

### Constructor

> **new TemplatePersonalizer**(`options?`): `TemplatePersonalizer`

Defined in: [packages/template/src/personalization/variable.replacer.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L88)

#### Parameters

##### options?

`Partial`\<[`TemplatePersonalizerOptions`](/en/api/template/src/interfaces/templatepersonalizeroptions/)\> = `{}`

#### Returns

`TemplatePersonalizer`

## Methods

### extractVariables()

> **extractVariables**(`content`): `string`[]

Defined in: [packages/template/src/personalization/variable.replacer.ts:161](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L161)

Extract variables from content without replacing

#### Parameters

##### content

`string`

#### Returns

`string`[]

***

### preview()

> **preview**(`content`, `variables`): `object`

Defined in: [packages/template/src/personalization/variable.replacer.ts:253](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L253)

Preview replacement result without actually replacing

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/en/api/template/src/type-aliases/templatevariablemap/)

#### Returns

`object`

##### originalContent

> **originalContent**: `string`

##### previewContent

> **previewContent**: `string`

##### variableHighlights

> **variableHighlights**: `object`[]

***

### replace()

> **replace**(`content`, `variables`): [`ReplacementResult`](/en/api/template/src/interfaces/replacementresult/)

Defined in: [packages/template/src/personalization/variable.replacer.ts:95](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L95)

Replace variables in content

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/en/api/template/src/type-aliases/templatevariablemap/)

#### Returns

[`ReplacementResult`](/en/api/template/src/interfaces/replacementresult/)

***

### validate()

> **validate**(`content`, `variables`): `object`

Defined in: [packages/template/src/personalization/variable.replacer.ts:214](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L214)

Validate that all required variables are provided

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/en/api/template/src/type-aliases/templatevariablemap/)

#### Returns

`object`

##### errors

> **errors**: [`ReplacementError`](/en/api/template/src/interfaces/replacementerror/)[]

##### isValid

> **isValid**: `boolean`

##### missingVariables

> **missingVariables**: `string`[]
