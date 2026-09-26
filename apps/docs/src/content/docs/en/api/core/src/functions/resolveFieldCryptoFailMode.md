---
editUrl: false
next: false
prev: false
title: "resolveFieldCryptoFailMode"
---

> **resolveFieldCryptoFailMode**(`config`): [`FieldCryptoFailMode`](/en/api/core/src/type-aliases/fieldcryptofailmode/)

Defined in: [packages/core/src/crypto/policy.ts:63](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/policy.ts#L63)

The fail mode to apply. Only an explicit `"open"` fails open; a missing or
unrecognized value, such as a typo in JSON configuration, fails closed.

## Parameters

### config

`Pick`\<[`FieldCryptoConfig`](/en/api/core/src/interfaces/fieldcryptoconfig/), `"failMode"`\>

## Returns

[`FieldCryptoFailMode`](/en/api/core/src/type-aliases/fieldcryptofailmode/)
