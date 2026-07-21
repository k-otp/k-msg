---
editUrl: false
next: false
prev: false
title: "RetryAfterPolicy"
---

Defined in: [packages/core/src/errors.ts:100](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L100)

## Properties

### byCode?

> `optional` **byCode?**: `Readonly`\<`Record`\<`string`, `number`\>\>

Defined in: [packages/core/src/errors.ts:104](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L104)

Delays keyed by provider error code or canonical KMsgErrorCode.

***

### byStatus?

> `optional` **byStatus?**: `Readonly`\<`Record`\<`string`, `number`\>\>

Defined in: [packages/core/src/errors.ts:106](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L106)

Delays keyed by normalized HTTP status.

***

### defaultMs?

> `optional` **defaultMs?**: `number`

Defined in: [packages/core/src/errors.ts:102](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L102)

Fallback delay when no code or status mapping matches.
