---
editUrl: false
next: false
prev: false
title: "ErrorRetryPolicy"
---

Defined in: [packages/core/src/errors.ts:119](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L119)

## Properties

### classifyByMessage?

> `optional` **classifyByMessage?**: (`message`) => [`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/) \| `undefined`

Defined in: [packages/core/src/errors.ts:127](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L127)

#### Parameters

##### message

`string`

#### Returns

[`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/) \| `undefined`

***

### classifyByStatusCode?

> `optional` **classifyByStatusCode?**: (`status`) => [`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:126](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L126)

#### Parameters

##### status

`number`

#### Returns

[`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/)

***

### fallback?

> `optional` **fallback?**: [`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:131](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L131)

Optional override for retry hint inference.

***

### nonRetryableCodes?

> `optional` **nonRetryableCodes?**: readonly [`KMsgErrorCode`](/en/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:121](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L121)

***

### nonRetryableStatuses?

> `optional` **nonRetryableStatuses?**: readonly `string`[]

Defined in: [packages/core/src/errors.ts:125](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L125)

Explicit non-retryable HTTP statuses; wins on conflicts.

***

### retryableCodes?

> `optional` **retryableCodes?**: readonly [`KMsgErrorCode`](/en/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:120](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L120)

***

### retryableStatuses?

> `optional` **retryableStatuses?**: readonly `string`[]

Defined in: [packages/core/src/errors.ts:123](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L123)

Explicit retryable HTTP statuses, normalized case-insensitively.

***

### retryAfterMs?

> `optional` **retryAfterMs?**: [`RetryAfterPolicy`](/en/api/core/src/interfaces/retryafterpolicy/) \| ((`error`) => `number` \| `undefined`)

Defined in: [packages/core/src/errors.ts:135](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L135)

Optional custom retry delay resolver or declarative mapping.
