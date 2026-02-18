---
editUrl: false
next: false
prev: false
title: "VariableReplacer"
---

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/personalization/variable.replacer.ts#L69)

## Constructors

### Constructor

> **new VariableReplacer**(`options?`): `VariableReplacer`

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/personalization/variable.replacer.ts#L81)

#### Parameters

##### options?

`Partial`\<`VariableReplacementOptions`\> = `{}`

#### Returns

`VariableReplacer`

## Methods

### extractVariables()

> **extractVariables**(`content`): `string`[]

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:154](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/personalization/variable.replacer.ts#L154)

Extract variables from content without replacing

#### Parameters

##### content

`string`

#### Returns

`string`[]

***

### preview()

> **preview**(`content`, `variables`): `object`

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:246](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/personalization/variable.replacer.ts#L246)

Preview replacement result without actually replacing

#### Parameters

##### content

`string`

##### variables

[`VariableMap`](/api/messaging/src/interfaces/variablemap/)

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

> **replace**(`content`, `variables`): `ReplacementResult`

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/personalization/variable.replacer.ts#L88)

Replace variables in content

#### Parameters

##### content

`string`

##### variables

[`VariableMap`](/api/messaging/src/interfaces/variablemap/)

#### Returns

`ReplacementResult`

***

### validate()

> **validate**(`content`, `variables`): `object`

Defined in: [packages/messaging/src/personalization/variable.replacer.ts:207](https://github.com/k-otp/k-msg/blob/main/packages/messaging/src/personalization/variable.replacer.ts#L207)

Validate that all required variables are provided

#### Parameters

##### content

`string`

##### variables

[`VariableMap`](/api/messaging/src/interfaces/variablemap/)

#### Returns

`object`

##### errors

> **errors**: `ReplacementError`[]

##### isValid

> **isValid**: `boolean`

##### missingVariables

> **missingVariables**: `string`[]
