---
editUrl: false
next: false
prev: false
title: "ErrorRetryPolicy"
---

Defined in: [packages/core/src/errors.ts:110](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L110)

## Properties

### classifyByMessage?

> `optional` **classifyByMessage?**: (`message`) => [`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/) \| `undefined`

Defined in: [packages/core/src/errors.ts:114](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L114)

#### Parameters

##### message

`string`

#### Returns

[`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/) \| `undefined`

***

### classifyByStatusCode?

> `optional` **classifyByStatusCode?**: (`status`) => [`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:113](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L113)

#### Parameters

##### status

`number`

#### Returns

[`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/)

***

### fallback?

> `optional` **fallback?**: [`ProviderRetryHint`](/en/api/core/src/type-aliases/providerretryhint/)

Defined in: [packages/core/src/errors.ts:118](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L118)

Optional override for retry hint inference.

***

### nonRetryableCodes?

> `optional` **nonRetryableCodes?**: readonly [`KMsgErrorCode`](/en/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:112](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L112)

***

### retryableCodes?

> `optional` **retryableCodes?**: readonly [`KMsgErrorCode`](/en/api/core/src/enumerations/kmsgerrorcode/)[]

Defined in: [packages/core/src/errors.ts:111](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L111)

***

### retryAfterMs?

> `optional` **retryAfterMs?**: (`error`) => `number` \| `undefined`

Defined in: [packages/core/src/errors.ts:122](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L122)

Optional custom retry delay in milliseconds.

#### Parameters

##### error

[`KMsgError`](/en/api/core/src/classes/kmsgerror/)

#### Returns

`number` \| `undefined`
