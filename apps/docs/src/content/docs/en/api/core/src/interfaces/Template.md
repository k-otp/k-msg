---
editUrl: false
next: false
prev: false
title: "Template"
---

Defined in: [packages/core/src/provider.ts:20](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L20)

Represents an AlimTalk template registered with a provider.
Templates must be approved by Kakao before use.

## Properties

### buttons?

> `optional` **buttons**: `unknown`[]

Defined in: [packages/core/src/provider.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L34)

Button configurations attached to the template.

***

### category?

> `optional` **category**: `string`

Defined in: [packages/core/src/provider.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L30)

Template category (e.g., "authentication", "promotion").

***

### code

> **code**: `string`

Defined in: [packages/core/src/provider.ts:24](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L24)

Template code used in send requests.

***

### content

> **content**: `string`

Defined in: [packages/core/src/provider.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L28)

Template body with #{variable} placeholders.

***

### createdAt

> **createdAt**: `Date`

Defined in: [packages/core/src/provider.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L38)

When the template was created.

***

### id

> **id**: `string`

Defined in: [packages/core/src/provider.ts:22](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L22)

Unique template identifier.

***

### name

> **name**: `string`

Defined in: [packages/core/src/provider.ts:26](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L26)

Human-readable template name.

***

### status

> **status**: `"PENDING"` \| `"APPROVED"` \| `"REJECTED"` \| `"INSPECTION"`

Defined in: [packages/core/src/provider.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L32)

Approval status of the template.

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/core/src/provider.ts:40](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L40)

When the template was last updated.

***

### variables?

> `optional` **variables**: `string`[]

Defined in: [packages/core/src/provider.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/core/src/provider.ts#L36)

Names of variables expected in the template content.
