---
editUrl: false
next: false
prev: false
title: "Template"
---

Defined in: [packages/core/src/provider.ts:56](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L56)

Represents an AlimTalk template registered with a provider.
Templates must be approved by Kakao before use.

## Properties

### buttons?

> `optional` **buttons?**: `unknown`[]

Defined in: [packages/core/src/provider.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L70)

Button configurations attached to the template.

***

### category?

> `optional` **category?**: `string`

Defined in: [packages/core/src/provider.ts:66](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L66)

Template category (e.g., "authentication", "promotion").

***

### code

> **code**: `string`

Defined in: [packages/core/src/provider.ts:60](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L60)

Template code used in send requests.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L64)

Template body with #{variable} placeholders.

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/provider.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L74)

When the template was created.

***

### id

> **id**: `string`

Defined in: [packages/core/src/provider.ts:58](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L58)

Unique template identifier.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L62)

Human-readable template name.

***

### status

> **status**: `"PENDING"` \| `"APPROVED"` \| `"REJECTED"` \| `"INSPECTION"`

Defined in: [packages/core/src/provider.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L68)

Approval status of the template.

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/core/src/provider.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L76)

When the template was last updated.

***

### variables?

> `optional` **variables?**: `string`[]

Defined in: [packages/core/src/provider.ts:72](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L72)

Names of variables expected in the template content.
