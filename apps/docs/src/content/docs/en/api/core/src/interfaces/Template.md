---
editUrl: false
next: false
prev: false
title: "Template"
---

Defined in: [packages/core/src/provider.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L55)

Represents an AlimTalk template registered with a provider.
Templates must be approved by Kakao before use.

## Properties

### buttons?

> `optional` **buttons?**: `unknown`[]

Defined in: [packages/core/src/provider.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L69)

Button configurations attached to the template.

***

### category?

> `optional` **category?**: `string`

Defined in: [packages/core/src/provider.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L65)

Template category (e.g., "authentication", "promotion").

***

### code

> **code**: `string`

Defined in: [packages/core/src/provider.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L59)

Template code used in send requests.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L63)

Template body with #{variable} placeholders.

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/provider.ts:73](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L73)

When the template was created.

***

### id

> **id**: `string`

Defined in: [packages/core/src/provider.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L57)

Unique template identifier.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L61)

Human-readable template name.

***

### status

> **status**: `"PENDING"` \| `"APPROVED"` \| `"REJECTED"` \| `"INSPECTION"`

Defined in: [packages/core/src/provider.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L67)

Approval status of the template.

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/core/src/provider.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L75)

When the template was last updated.

***

### variables?

> `optional` **variables?**: `string`[]

Defined in: [packages/core/src/provider.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L71)

Names of variables expected in the template content.
