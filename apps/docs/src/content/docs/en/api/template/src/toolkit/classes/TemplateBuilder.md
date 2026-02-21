---
editUrl: false
next: false
prev: false
title: "TemplateBuilder"
---

Defined in: [packages/template/src/builder/template.builder.ts:15](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L15)

## Constructors

### Constructor

> **new TemplateBuilder**(): `TemplateBuilder`

#### Returns

`TemplateBuilder`

## Methods

### appLinkButton()

> **appLinkButton**(`name`, `options`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:172](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L172)

Add an app link button

#### Parameters

##### name

`string`

##### options

###### androidScheme?

`string`

###### androidUrl?

`string`

###### iosScheme?

`string`

###### iosUrl?

`string`

#### Returns

`TemplateBuilder`

***

### botKeywordButton()

> **botKeywordButton**(`name`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:204](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L204)

Add a bot keyword button

#### Parameters

##### name

`string`

#### Returns

`TemplateBuilder`

***

### build()

> **build**(): [`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)

Defined in: [packages/template/src/builder/template.builder.ts:374](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L374)

Build the final template

#### Returns

[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)

***

### button()

> **button**(`button`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:224](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L224)

Add a custom button

#### Parameters

##### button

[`TemplateButton`](/api/template/src/interfaces/templatebutton/)

#### Returns

`TemplateBuilder`

***

### category()

> **category**(`category`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L68)

Set template category

#### Parameters

##### category

[`TemplateCategory`](/api/template/src/enumerations/templatecategory/)

#### Returns

`TemplateBuilder`

***

### clearButtons()

> **clearButtons**(): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:240](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L240)

Clear all buttons

#### Returns

`TemplateBuilder`

***

### clone()

> **clone**(): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:347](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L347)

Clone the current builder

#### Returns

`TemplateBuilder`

***

### code()

> **code**(`code`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L38)

Set template code (provider specific)

#### Parameters

##### code

`string`

#### Returns

`TemplateBuilder`

***

### content()

> **content**(`content`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L46)

Set template content with variables

#### Parameters

##### content

`string`

#### Returns

`TemplateBuilder`

***

### deliveryButton()

> **deliveryButton**(`name`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:194](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L194)

Add a delivery tracking button

#### Parameters

##### name

`string`

#### Returns

`TemplateBuilder`

***

### messageDeliveryButton()

> **messageDeliveryButton**(`name`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:214](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L214)

Add a message delivery button

#### Parameters

##### name

`string`

#### Returns

`TemplateBuilder`

***

### metadata()

> **metadata**(`metadata`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:248](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L248)

Set template metadata

#### Parameters

##### metadata

`Partial`\<[`AlimTalkTemplate`](/api/template/src/interfaces/alimtalktemplate/)\[`"metadata"`\]\>

#### Returns

`TemplateBuilder`

***

### name()

> **name**(`name`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L30)

Set template name

#### Parameters

##### name

`string`

#### Returns

`TemplateBuilder`

***

### preview()

> **preview**(`sampleVariables?`): `string`

Defined in: [packages/template/src/builder/template.builder.ts:291](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L291)

Preview the template with sample variables

#### Parameters

##### sampleVariables?

`Record`\<`string`, `any`\> = `{}`

#### Returns

`string`

***

### provider()

> **provider**(`provider`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L76)

Set template provider

#### Parameters

##### provider

`string`

#### Returns

`TemplateBuilder`

***

### reset()

> **reset**(): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:357](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L357)

Reset the builder to start fresh

#### Returns

`TemplateBuilder`

***

### status()

> **status**(`status`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L84)

Set template status

#### Parameters

##### status

[`TemplateStatus`](/api/template/src/enumerations/templatestatus/)

#### Returns

`TemplateBuilder`

***

### validate()

> **validate**(): `object`

Defined in: [packages/template/src/builder/template.builder.ts:266](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L266)

Validate the current template

#### Returns

`object`

##### errors

> **errors**: `string`[]

##### isValid

> **isValid**: `boolean`

##### warnings

> **warnings**: `string`[]

***

### variable()

> **variable**(`name`, `type?`, `required?`, `options?`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L92)

Add a variable definition

#### Parameters

##### name

`string`

##### type?

`"string"` | `"number"` | `"date"` | `"custom"`

##### required?

`boolean` = `true`

##### options?

###### description?

`string`

###### example?

`string`

###### format?

`string`

###### maxLength?

`number`

#### Returns

`TemplateBuilder`

***

### variables()

> **variables**(`variables`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L126)

Add multiple variables at once

#### Parameters

##### variables

`object`[]

#### Returns

`TemplateBuilder`

***

### webLinkButton()

> **webLinkButton**(`name`, `mobileUrl?`, `pcUrl?`): `TemplateBuilder`

Defined in: [packages/template/src/builder/template.builder.ts:156](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L156)

Add a web link button

#### Parameters

##### name

`string`

##### mobileUrl?

`string`

##### pcUrl?

`string`

#### Returns

`TemplateBuilder`
