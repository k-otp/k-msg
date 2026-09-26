---
editUrl: false
next: false
prev: false
title: "TemplateCreateInput"
---

> **TemplateCreateInput** = `object`

Defined in: [packages/core/src/provider.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L81)

Input for creating a new AlimTalk template.

## Properties

### buttons?

> `optional` **buttons?**: `unknown`[]

Defined in: [packages/core/src/provider.ts:89](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L89)

Button configurations.

***

### category?

> `optional` **category?**: `string`

Defined in: [packages/core/src/provider.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L87)

Template category.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L85)

Template body with #{variable} placeholders.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L83)

Human-readable template name.

***

### variables?

> `optional` **variables?**: `string`[]

Defined in: [packages/core/src/provider.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L91)

Expected variable names in the template.
