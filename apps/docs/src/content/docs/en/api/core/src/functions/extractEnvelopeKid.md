---
editUrl: false
next: false
prev: false
title: "extractEnvelopeKid"
---

> **extractEnvelopeKid**(`ciphertext`): `string` \| `undefined`

Defined in: [packages/core/src/crypto/key-selection.ts:19](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/key-selection.ts#L19)

Reads the `kid` of a v1 ciphertext envelope, exactly as written. Returns
`undefined` for any other value, including a provider's own JSON format.

## Parameters

### ciphertext

`unknown`

## Returns

`string` \| `undefined`
