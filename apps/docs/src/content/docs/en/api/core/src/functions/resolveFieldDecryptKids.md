---
editUrl: false
next: false
prev: false
title: "resolveFieldDecryptKids"
---

> **resolveFieldDecryptKids**(`config`, `context`): `Promise`\<readonly `string`[] \| `undefined`\>

Defined in: [packages/core/src/crypto/key-selection.ts:71](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/key-selection.ts#L71)

The `candidateKids` to decrypt a field with: the envelope's own `kid` first,
then every `kid` from `resolveDecryptKeys`. Without `resolveDecryptKeys`
it returns `undefined`, and the provider picks the key from its ciphertext.

## Parameters

### config

[`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/) & `object`

## Returns

`Promise`\<readonly `string`[] \| `undefined`\>
