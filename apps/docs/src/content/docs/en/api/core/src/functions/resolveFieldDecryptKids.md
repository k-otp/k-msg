---
editUrl: false
next: false
prev: false
title: "resolveFieldDecryptKids"
---

> **resolveFieldDecryptKids**(`config`, `context`): `Promise`\<readonly `string`[] \| `undefined`\>

Defined in: [packages/core/src/crypto/key-selection.ts:70](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/key-selection.ts#L70)

The `candidateKids` to decrypt a field with: the envelope's own `kid` first,
then every `kid` from `resolveDecryptKeys`. `undefined` lets the provider
pick the key from the envelope.

## Parameters

### config

[`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/) & `object`

## Returns

`Promise`\<readonly `string`[] \| `undefined`\>
