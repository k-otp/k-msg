---
editUrl: false
next: false
prev: false
title: "assertCryptoEnvelopeV1"
---

> **assertCryptoEnvelopeV1**(`value`): `asserts value is CryptoEnvelope`

Defined in: [packages/core/src/crypto/types.ts:507](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/types.ts#L507)

Throws unless `value` is a v1 envelope: `v` 1, `alg` "A256GCM", and string
`kid`, `iv`, `tag`, and `ct`.

## Parameters

### value

`unknown`

## Returns

`asserts value is CryptoEnvelope`
