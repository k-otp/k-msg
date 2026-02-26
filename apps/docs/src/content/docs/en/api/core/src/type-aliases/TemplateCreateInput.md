---
editUrl: false
next: false
prev: false
title: "TemplateCreateInput"
---

> **TemplateCreateInput** = `object`

Defined in: [packages/core/src/provider.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L46)

Input for creating a new AlimTalk template.

## Properties

### buttons?

> `optional` **buttons**: `unknown`[]

Defined in: [packages/core/src/provider.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L54)

Button configurations.

***

### category?

> `optional` **category**: `string`

Defined in: [packages/core/src/provider.ts:52](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L52)

Template category.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L50)

Template body with #{variable} placeholders.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:48](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L48)

Human-readable template name.

***

### variables?

> `optional` **variables**: `string`[]

Defined in: [packages/core/src/provider.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L56)

Expected variable names in the template.
