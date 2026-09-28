---
editUrl: false
next: false
prev: false
title: "KeyResolver"
---

Defined in: [packages/core/src/crypto/types.ts:53](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L53)

## Methods

### resolveDecryptKeys()?

> `optional` **resolveDecryptKeys**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

Defined in: [packages/core/src/crypto/types.ts:57](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L57)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/) & `object`

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

***

### resolveEncryptKey()

> **resolveEncryptKey**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L54)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>
