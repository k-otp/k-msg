---
editUrl: false
next: false
prev: false
title: "TemplateCreateInput"
---

> **TemplateCreateInput** = `object`

Defined in: [packages/core/src/provider.ts:82](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L82)

Input for creating a new AlimTalk template.

## Properties

### buttons?

> `optional` **buttons?**: `unknown`[]

Defined in: [packages/core/src/provider.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L90)

Button configurations.

***

### category?

> `optional` **category?**: `string`

Defined in: [packages/core/src/provider.ts:88](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L88)

Template category.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L86)

Template body with #{variable} placeholders.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:84](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L84)

Human-readable template name.

***

### variables?

> `optional` **variables?**: `string`[]

Defined in: [packages/core/src/provider.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L92)

Expected variable names in the template.
