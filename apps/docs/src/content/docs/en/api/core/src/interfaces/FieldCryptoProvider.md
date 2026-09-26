---
editUrl: false
next: false
prev: false
title: "FieldCryptoProvider"
---

Defined in: [packages/core/src/crypto/types.ts:86](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L86)

## Methods

### decrypt()

> **decrypt**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:90](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L90)

#### Parameters

##### input

[`FieldCryptoDecryptInput`](/en/api/core/src/interfaces/fieldcryptodecryptinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### encrypt()

> **encrypt**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/en/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

Defined in: [packages/core/src/crypto/types.ts:87](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L87)

#### Parameters

##### input

[`FieldCryptoEncryptInput`](/en/api/core/src/interfaces/fieldcryptoencryptinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<\{ `ciphertext`: `string` \| [`CryptoEnvelope`](/en/api/core/src/interfaces/cryptoenvelope/); `kid?`: `string`; \}\>

***

### hash()

> **hash**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:91](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L91)

#### Parameters

##### input

[`FieldCryptoHashInput`](/en/api/core/src/interfaces/fieldcryptohashinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

***

### mask()?

> `optional` **mask**(`input`): [`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>

Defined in: [packages/core/src/crypto/types.ts:92](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L92)

#### Parameters

##### input

[`FieldCryptoMaskInput`](/en/api/core/src/interfaces/fieldcryptomaskinput/)

#### Returns

[`MaybePromise`](/en/api/core/src/type-aliases/maybepromise/)\<`string`\>
