---
editUrl: false
next: false
prev: false
title: "resolveFieldEncryptKid"
---

> **resolveFieldEncryptKid**(`config`, `context`): `Promise`\<`string` \| `undefined`\>

Defined in: [packages/core/src/crypto/key-selection.ts:38](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/key-selection.ts#L38)

The `kid` a field is encrypted under: the one `resolveEncryptKey` returns,
or `undefined` for the provider's default key when there is no resolver or
it returns a blank `kid`.

## Parameters

### config

[`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/)

### context

[`FieldCryptoKeyContext`](/en/api/core/src/interfaces/fieldcryptokeycontext/)

## Returns

`Promise`\<`string` \| `undefined`\>
