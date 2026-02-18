---
editUrl: false
next: false
prev: false
title: "VariableUtils"
---

> `const` **VariableUtils**: `object`

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:746](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/messaging/src/personalization/variable.replacer.ts#L746)

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

[`VariableMap`](/api/messaging/src/interfaces/variablemap/)

#### Returns

`string`

### validate()

> **validate**: (`content`, `variables`) => `boolean`

Validate content has all required variables

#### Parameters

##### content

`string`

##### variables

[`VariableMap`](/api/messaging/src/interfaces/variablemap/)

#### Returns

`boolean`
