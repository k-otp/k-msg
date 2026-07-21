---
editUrl: false
next: false
prev: false
title: "TemplateCreateInput"
---

> **TemplateCreateInput** = `object`

Defined in: [packages/core/src/provider.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L75)

Input for creating a new AlimTalk template.

## Properties

### buttons?

> `optional` **buttons?**: `unknown`[]

Defined in: [packages/core/src/provider.ts:83](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L83)

Button configurations.

***

### category?

> `optional` **category?**: `string`

Defined in: [packages/core/src/provider.ts:81](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L81)

Template category.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:79](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L79)

Template body with #{variable} placeholders.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:77](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L77)

Human-readable template name.

***

### variables?

> `optional` **variables?**: `string`[]

Defined in: [packages/core/src/provider.ts:85](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L85)

Expected variable names in the template.
