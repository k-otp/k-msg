---
editUrl: false
next: false
prev: false
title: "FieldCryptoProvider"
---

Defined in: [packages/core/src/crypto/types.ts:64](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L64)

## Methods

### decrypt()

> **decrypt**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:68](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L68)

#### Parameters

##### input

[`FieldCryptoDecryptInput`](/api/core/src/interfaces/fieldcryptodecryptinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### encrypt()

> **encrypt**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:65](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L65)

#### Parameters

##### input

[`FieldCryptoEncryptInput`](/api/core/src/interfaces/fieldcryptoencryptinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

***

### hash()

> **hash**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:69](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L69)

#### Parameters

##### input

[`FieldCryptoHashInput`](/api/core/src/interfaces/fieldcryptohashinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### mask()?

> `optional` **mask**(`input`): [`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L70)

#### Parameters

##### input

[`FieldCryptoMaskInput`](/api/core/src/interfaces/fieldcryptomaskinput/)

#### Returns

[`MaybePromise`](/api/core/src/type-aliases/maybepromise/)\<`string`\>
