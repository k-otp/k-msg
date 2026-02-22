---
editUrl: false
next: false
prev: false
title: "ErrorRetryPolicy"
---

Defined in: [packages/core/src/errors.ts:34](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L34)

## Properties

### classifyByMessage()?

> `optional` **classifyByMessage**: (`message`) => [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/) \| `undefined`

Defined in: [packages/core/src/errors.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L38)

#### Parameters

##### message

`string`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/) \| `undefined`

***

### classifyByStatusCode()?

> `optional` **classifyByStatusCode**: (`status`) => [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:37](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L37)

#### Parameters

##### status

`number`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

***

### fallback?

> `optional` **fallback**: [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:42](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L42)

Optional override for retry hint inference.

***

### nonRetryableCodes?

> `optional` **nonRetryableCodes**: readonly [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:36](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L36)

***

### retryableCodes?

> `optional` **retryableCodes**: readonly [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:35](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L35)

***

### retryAfterMs()?

> `optional` **retryAfterMs**: (`error`) => `number` \| `undefined`

Defined in: [packages/core/src/errors.ts:46](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L46)

Optional custom retry delay in milliseconds.

#### Parameters

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Returns

`number` \| `undefined`
