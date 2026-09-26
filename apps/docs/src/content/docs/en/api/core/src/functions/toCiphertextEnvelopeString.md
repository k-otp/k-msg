---
editUrl: false
next: false
prev: false
title: "toCiphertextEnvelopeString"
---

> **toCiphertextEnvelopeString**(`ciphertext`): `string`

Defined in: [packages/core/src/crypto/types.ts:527](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L527)

Serializes provider ciphertext for storage. An envelope object must be a v1
envelope; a string is the provider's own serialized form and is kept as is.

## Parameters

### ciphertext

`string` \| [`CryptoEnvelope`](/en/api/core/src/interfaces/cryptoenvelope/)

## Returns

`string`
