---
editUrl: false
next: false
prev: false
title: "KeyResolver"
---

Defined in: [packages/core/src/crypto/types.ts:50](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L50)

## Methods

### resolveDecryptKeys()?

> `optional` **resolveDecryptKeys**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

Defined in: [packages/core/src/crypto/types.ts:54](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L54)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/) & `object`

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

***

### resolveEncryptKey()

> **resolveEncryptKey**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:51](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L51)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>
