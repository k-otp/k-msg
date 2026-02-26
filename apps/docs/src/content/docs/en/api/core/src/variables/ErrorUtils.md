---
editUrl: false
next: false
prev: false
title: "ErrorUtils"
---

> `const` **ErrorUtils**: `object`

Defined in: [packages/core/src/errors.ts:271](https://github.com/k-otp/k-msg/blob/main/packages/core/src/errors.ts#L271)

## Type Declaration

### DEFAULT\_NON\_RETRYABLE\_ERROR\_CODES

> **DEFAULT\_NON\_RETRYABLE\_ERROR\_CODES**: `ReadonlySet`\<[`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)\>

### DEFAULT\_RETRYABLE\_ERROR\_CODES

> **DEFAULT\_RETRYABLE\_ERROR\_CODES**: `ReadonlySet`\<[`KMsgErrorCode`](/api/core/src/enumerations/kmsgerrorcode/)\>

### isUnknownStatus()

> **isUnknownStatus**: (`statusCode`) => `boolean`

#### Parameters

##### statusCode

`number` | `undefined`

#### Returns

`boolean`

### classifyForRetry()

> **classifyForRetry**(`error`, `policy?`): [`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

#### Parameters

##### error

`unknown`

##### policy?

[`ErrorRetryPolicy`](/api/core/src/interfaces/errorretrypolicy/) = `{}`

#### Returns

[`ProviderRetryHint`](/api/core/src/type-aliases/providerretryhint/)

### isRetryable()

> **isRetryable**(`error`, `policy?`): `boolean`

#### Parameters

##### error

`unknown`

##### policy?

[`ErrorRetryPolicy`](/api/core/src/interfaces/errorretrypolicy/) = `{}`

#### Returns

`boolean`

### resolveRetryAfterMs()

> **resolveRetryAfterMs**(`error`, `policy?`): `number` \| `undefined`

#### Parameters

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

##### policy?

[`ErrorRetryPolicy`](/api/core/src/interfaces/errorretrypolicy/)

#### Returns

`number` \| `undefined`

### toRetryMetadata()

> **toRetryMetadata**(`error`): [`KMsgErrorMetadata`](/api/core/src/interfaces/kmsgerrormetadata/)

#### Parameters

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Returns

[`KMsgErrorMetadata`](/api/core/src/interfaces/kmsgerrormetadata/)

### withAttempt()

> **withAttempt**(`error`, `attempt`): [`KMsgError`](/api/core/src/classes/kmsgerror/)

#### Parameters

##### error

[`KMsgError`](/api/core/src/classes/kmsgerror/)

##### attempt

`number`

#### Returns

[`KMsgError`](/api/core/src/classes/kmsgerror/)
