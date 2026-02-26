---
editUrl: false
next: false
prev: false
title: "ErrorRetryPolicy"
---

Defined in: [packages/core/src/errors.ts:105](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L105)

## Properties

### classifyByMessage()?

> `optional` **classifyByMessage**: (`message`) => [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/) \| `undefined`

Defined in: [packages/core/src/errors.ts:109](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L109)

#### Parameters

##### message

`string`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/) \| `undefined`

***

### classifyByStatusCode()?

> `optional` **classifyByStatusCode**: (`status`) => [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:108](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L108)

#### Parameters

##### status

`number`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

***

### fallback?

> `optional` **fallback**: [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L113)

Optional override for retry hint inference.

***

### nonRetryableCodes?

> `optional` **nonRetryableCodes**: readonly [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:107](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L107)

***

### retryableCodes?

> `optional` **retryableCodes**: readonly [`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:106](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L106)

***

### retryAfterMs()?

> `optional` **retryAfterMs**: (`error`) => `number` \| `undefined`

Defined in: [packages/core/src/errors.ts:117](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L117)

Optional custom retry delay in milliseconds.

#### Parameters

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Returns

`number` \| `undefined`
