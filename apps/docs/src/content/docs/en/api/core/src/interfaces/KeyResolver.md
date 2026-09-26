---
editUrl: false
next: false
prev: false
title: "KeyResolver"
---

Defined in: [packages/core/src/crypto/types.ts:61](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L61)

Chooses the key id used to write and the key ids tried when reading.

## Methods

### resolveDecryptKeys()?

> `optional` **resolveDecryptKeys**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

Defined in: [packages/core/src/crypto/types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L65)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/) & `object`

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<readonly `string`[]\>

***

### resolveEncryptKey()

> **resolveEncryptKey**(`context`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:62](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L62)

#### Parameters

##### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `kid`: `string`; \}\>
