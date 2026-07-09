---
editUrl: false
next: false
prev: false
title: "FieldCryptoProvider"
---

Defined in: [packages/core/src/crypto/types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L70)

## Methods

### decrypt()

> **decrypt**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L74)

#### Parameters

##### input

[`FieldCryptoDecryptInput`](/en/api/core/src/interfaces/fieldcryptodecryptinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### encrypt()

> **encrypt**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/en/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L71)

#### Parameters

##### input

[`FieldCryptoEncryptInput`](/en/api/core/src/interfaces/fieldcryptoencryptinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/en/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

***

### hash()

> **hash**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L75)

#### Parameters

##### input

[`FieldCryptoHashInput`](/en/api/core/src/interfaces/fieldcryptohashinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### mask()?

> `optional` **mask**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L76)

#### Parameters

##### input

[`FieldCryptoMaskInput`](/en/api/core/src/interfaces/fieldcryptomaskinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>
