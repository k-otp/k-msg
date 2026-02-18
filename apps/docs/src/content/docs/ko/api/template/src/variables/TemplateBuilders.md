---
editUrl: false
next: false
prev: false
title: "TemplateBuilders"
---

> `const` **TemplateBuilders**: `object`

Defined in: [packages/template/src/builder/template.builder.ts:419](https://github.com/k-otp/k-msg/blob/main/packages/template/src/builder/template.builder.ts#L419)

Static factory methods for common template types

## Type Declaration

### authentication()

> **authentication**(`name`, `provider`): [`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

Create an authentication template builder

#### Parameters

##### name

`string`

##### provider

`string`

#### Returns

[`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

### notification()

> **notification**(`name`, `provider`): [`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

Create a notification template builder

#### Parameters

##### name

`string`

##### provider

`string`

#### Returns

[`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

### payment()

> **payment**(`name`, `provider`): [`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

Create a payment template builder

#### Parameters

##### name

`string`

##### provider

`string`

#### Returns

[`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

### promotion()

> **promotion**(`name`, `provider`): [`TemplateBuilder`](/api/template/src/classes/templatebuilder/)

Create a promotion template builder

#### Parameters

##### name

`string`

##### provider

`string`

#### Returns

[`TemplateBuilder`](/api/template/src/classes/templatebuilder/)
