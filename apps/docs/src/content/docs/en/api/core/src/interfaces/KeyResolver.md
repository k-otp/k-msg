---
editUrl: false
next: false
prev: false
title: "KeyResolver"
---

Defined in: [packages/core/src/crypto/types.ts:28](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L28)

## Methods

### resolveDecryptKeys()?

> `optional` **resolveDecryptKeys**(`context`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

Defined in: [packages/core/src/crypto/types.ts:32](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L32)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/api/core/src/interfaces/fieldcryptokeycontext/) & `object`

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

***

### resolveEncryptKey()

> **resolveEncryptKey**(`context`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:29](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L29)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/api/core/src/interfaces/fieldcryptokeycontext/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>
