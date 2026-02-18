---
editUrl: false
next: false
prev: false
title: "TemplateValidator"
---

Defined in: [packages/template/src/parser/validator.ts:14](https://github.com/k-otp/k-msg/blob/main/packages/template/src/parser/validator.ts#L14)

## Constructors

### Constructor

> **new TemplateValidator**(): `TemplateValidator`

#### Returns

`TemplateValidator`

## Methods

### quickValidate()

> `static` **quickValidate**(`template`): [`ValidationResult`](/api/template/src/interfaces/validationresult/)

Defined in: [packages/template/src/parser/validator.ts:206](https://github.com/k-otp/k-msg/blob/main/packages/template/src/parser/validator.ts#L206)

빠른 검증 - 기본적인 필수 필드만 검사

#### Parameters

##### template

`Partial`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\>

#### Returns

[`ValidationResult`](/api/template/src/interfaces/validationresult/)

***

### validate()

> `static` **validate**(`template`): [`ValidationResult`](/api/template/src/interfaces/validationresult/)

Defined in: [packages/template/src/parser/validator.ts:18](https://github.com/k-otp/k-msg/blob/main/packages/template/src/parser/validator.ts#L18)

알림톡 템플릿의 전체적인 유효성을 검증합니다

#### Parameters

##### template

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)

#### Returns

[`ValidationResult`](/api/template/src/interfaces/validationresult/)
