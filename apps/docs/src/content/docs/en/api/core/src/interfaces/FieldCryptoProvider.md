---
editUrl: false
next: false
prev: false
title: "FieldCryptoProvider"
---

Defined in: [packages/core/src/crypto/types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L70)

## Methods

### decrypt()

> **decrypt**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:74](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L74)

#### Parameters

##### input

[`FieldCryptoDecryptInput`](/api/core/src/interfaces/fieldcryptodecryptinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### encrypt()

> **encrypt**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L71)

#### Parameters

##### input

[`FieldCryptoEncryptInput`](/api/core/src/interfaces/fieldcryptoencryptinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

***

### hash()

> **hash**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:75](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L75)

#### Parameters

##### input

[`FieldCryptoHashInput`](/api/core/src/interfaces/fieldcryptohashinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### mask()?

> `optional` **mask**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:76](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L76)

#### Parameters

##### input

[`FieldCryptoMaskInput`](/api/core/src/interfaces/fieldcryptomaskinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>
