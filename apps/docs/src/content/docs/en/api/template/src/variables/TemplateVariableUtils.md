---
editUrl: false
next: false
prev: false
title: "TemplateVariableUtils"
---

> `const` **TemplateVariableUtils**: `object`

Defined in: [packages/template/src/personalization/variable.replacer.ts:746](https://github.com/k-otp/k-msg/blob/main/packages/template/src/personalization/variable.replacer.ts#L746)

Utility functions

## Type Declaration

### extractVariables()

> **extractVariables**: (`content`) => `string`[]

Extract all variables from content

#### Parameters

##### content

`string`

#### Returns

`string`[]

### personalize()

> **personalize**: (`content`, `recipients`) => `object`[]

Create personalized content for multiple recipients

#### Parameters

##### content

`string`

##### recipients

`object`[]

#### Returns

`object`[]

### replace()

> **replace**: (`content`, `variables`) => `string`

Replace variables in content

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/api/template/src/type-aliases/templatevariablemap/)

#### Returns

`string`

### validate()

> **validate**: (`content`, `variables`) => `boolean`

Validate content has all required variables

#### Parameters

##### content

`string`

##### variables

[`TemplateVariableMap`](/api/template/src/type-aliases/templatevariablemap/)

#### Returns

`boolean`
