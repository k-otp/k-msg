---
editUrl: false
next: false
prev: false
title: "VariableParser"
---

Defined in: [packages/template/src/parser/variable.parser.ts:3](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/variable.parser.ts#L3)

## Constructors

### Constructor

> **new VariableParser**(): `VariableParser`

#### Returns

`VariableParser`

## Methods

### extractVariables()

> `static` **extractVariables**(`content`): `string`[]

Defined in: [packages/template/src/parser/variable.parser.ts:9](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/variable.parser.ts#L9)

템플릿 내용에서 변수를 추출합니다

#### Parameters

##### content

`string`

#### Returns

`string`[]

***

### replaceVariables()

> `static` **replaceVariables**(`content`, `variables`): `string`

Defined in: [packages/template/src/parser/variable.parser.ts:26](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/variable.parser.ts#L26)

템플릿 내용의 변수를 실제 값으로 치환합니다

#### Parameters

##### content

`string`

##### variables

`Record`\<`string`, `string` \| `number` \| `Date`\>

#### Returns

`string`

***

### validateTemplateVariables()

> `static` **validateTemplateVariables**(`content`, `variableDefinitions`): `object`

Defined in: [packages/template/src/parser/variable.parser.ts:123](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/variable.parser.ts#L123)

템플릿에서 사용된 변수와 정의된 변수의 일치성을 검사합니다

#### Parameters

##### content

`string`

##### variableDefinitions

[`TemplateVariable`](/api/template/src/interfaces/templatevariable/)[]

#### Returns

`object`

##### errors

> **errors**: `string`[]

##### isValid

> **isValid**: `boolean`

***

### validateVariables()

> `static` **validateVariables**(`variableDefinitions`, `providedVariables`): `object`

Defined in: [packages/template/src/parser/variable.parser.ts:51](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/variable.parser.ts#L51)

변수 정의와 실제 제공된 값을 검증합니다

#### Parameters

##### variableDefinitions

[`TemplateVariable`](/api/template/src/interfaces/templatevariable/)[]

##### providedVariables

`Record`\<`string`, `any`\>

#### Returns

`object`

##### errors

> **errors**: `string`[]

##### isValid

> **isValid**: `boolean`
