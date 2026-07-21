---
editUrl: false
next: false
prev: false
title: "Template"
---

Defined in: [packages/core/src/provider.ts:49](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L49)

Represents an AlimTalk template registered with a provider.
Templates must be approved by Kakao before use.

## Properties

### buttons?

> `optional` **buttons?**: `unknown`[]

Defined in: [packages/core/src/provider.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L63)

Button configurations attached to the template.

***

### category?

> `optional` **category?**: `string`

Defined in: [packages/core/src/provider.ts:59](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L59)

Template category (e.g., "authentication", "promotion").

***

### code

> **code**: `string`

Defined in: [packages/core/src/provider.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L53)

Template code used in send requests.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L57)

Template body with #{variable} placeholders.

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/provider.ts:67](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L67)

When the template was created.

***

### id

> **id**: `string`

Defined in: [packages/core/src/provider.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L51)

Unique template identifier.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:55](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L55)

Human-readable template name.

***

### status

> **status**: `"PENDING"` \| `"APPROVED"` \| `"REJECTED"` \| `"INSPECTION"`

Defined in: [packages/core/src/provider.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L61)

Approval status of the template.

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/core/src/provider.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L69)

When the template was last updated.

***

### variables?

> `optional` **variables?**: `string`[]

Defined in: [packages/core/src/provider.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L65)

Names of variables expected in the template content.
