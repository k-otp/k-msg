---
editUrl: false
next: false
prev: false
title: "TemplatePersonalizer"
---

Defined in: packages/template/src/personalization/variable.replacer.ts:69

## Constructors

### Constructor

> **new TemplatePersonalizer**(`options?`): `TemplatePersonalizer`

Defined in: packages/template/src/personalization/variable.replacer.ts:81

#### Parameters

##### options?

`Partial`\<[`TemplatePersonalizerOptions`](/api/template/src/interfaces/templatepersonalizeroptions/)\> = `{}`

#### Returns

`TemplatePersonalizer`

## Methods

### extractVariables()

> **extractVariables**(`content`): `string`[]

Defined in: packages/template/src/personalization/variable.replacer.ts:154

Extract variables from content without replacing

#### Parameters

##### content

`string`

#### Returns

`string`[]

***

### preview()

> **preview**(`content`, `variables`): `object`

Defined in: packages/template/src/personalization/variable.replacer.ts:246

Preview replacement result without actually replacing

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/api/template/src/type-aliases/templatevariablemap/)

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

> **replace**(`content`, `variables`): [`ReplacementResult`](/api/template/src/interfaces/replacementresult/)

Defined in: packages/template/src/personalization/variable.replacer.ts:88

Replace variables in content

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/api/template/src/type-aliases/templatevariablemap/)

#### Returns

[`ReplacementResult`](/api/template/src/interfaces/replacementresult/)

***

### validate()

> **validate**(`content`, `variables`): `object`

Defined in: packages/template/src/personalization/variable.replacer.ts:207

Validate that all required variables are provided

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/api/template/src/type-aliases/templatevariablemap/)

#### Returns

`object`

##### errors

> **errors**: [`ReplacementError`](/api/template/src/interfaces/replacementerror/)[]

##### isValid

> **isValid**: `boolean`

##### missingVariables

> **missingVariables**: `string`[]
