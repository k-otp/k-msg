---
editUrl: false
next: false
prev: false
title: "ErrorRetryPolicy"
---

Defined in: [packages/core/src/errors.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L29)

## Properties

### classifyByMessage()?

> `optional` **classifyByMessage**: (`message`) => [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/) \| `undefined`

Defined in: [packages/core/src/errors.ts:33](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L33)

#### Parameters

##### message

`string`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/) \| `undefined`

***

### classifyByStatusCode()?

> `optional` **classifyByStatusCode**: (`status`) => [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L32)

#### Parameters

##### status

`number`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

***

### fallback?

> `optional` **fallback**: [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L37)

Optional override for retry hint inference.

***

### nonRetryableCodes?

> `optional` **nonRetryableCodes**: readonly [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:31](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L31)

***

### retryableCodes?

> `optional` **retryableCodes**: readonly [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:30](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L30)

***

### retryAfterMs()?

> `optional` **retryAfterMs**: (`error`) => `number` \| `undefined`

Defined in: [packages/core/src/errors.ts:41](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L41)

Optional custom retry delay in milliseconds.

#### Parameters

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Returns

`number` \| `undefined`
