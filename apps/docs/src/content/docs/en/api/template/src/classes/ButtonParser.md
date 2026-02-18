---
editUrl: false
next: false
prev: false
title: "ButtonParser"
---

Defined in: [packages/template/src/parser/button.parser.ts:3](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/button.parser.ts#L3)

## Constructors

### Constructor

> **new ButtonParser**(): `ButtonParser`

#### Returns

`ButtonParser`

## Methods

### deserializeButtons()

> `static` **deserializeButtons**(`buttonsJson`): [`TemplateButton`](/api/template/src/interfaces/templatebutton/)[]

Defined in: [packages/template/src/parser/button.parser.ts:169](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/button.parser.ts#L169)

JSON 문자열에서 버튼 배열로 역직렬화합니다

#### Parameters

##### buttonsJson

`string`

#### Returns

[`TemplateButton`](/api/template/src/interfaces/templatebutton/)[]

***

### serializeButtons()

> `static` **serializeButtons**(`buttons`): `string`

Defined in: [packages/template/src/parser/button.parser.ts:151](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/button.parser.ts#L151)

버튼을 JSON 문자열로 직렬화합니다 (카카오 API 형식)

#### Parameters

##### buttons

[`TemplateButton`](/api/template/src/interfaces/templatebutton/)[]

#### Returns

`string`

***

### validateButtons()

> `static` **validateButtons**(`buttons`): `object`

Defined in: [packages/template/src/parser/button.parser.ts:7](https://github.com/k-otp/k-msg/blob/6a36eef039aac25baeffb88785f2ebe5e4151ab2/packages/template/src/parser/button.parser.ts#L7)

버튼 설정의 유효성을 검증합니다

#### Parameters

##### buttons

[`TemplateButton`](/api/template/src/interfaces/templatebutton/)[]

#### Returns

`object`

##### errors

> **errors**: `string`[]

##### isValid

> **isValid**: `boolean`
