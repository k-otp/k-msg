---
editUrl: false
next: false
prev: false
title: "ActiveKidRolloutPolicy"
---

Defined in: [packages/core/src/crypto/rollout-policy.ts:8](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/rollout-policy.ts#L8)

## Properties

### buckets

> **buckets**: readonly [`ActiveKidRolloutBucket`](/api/core/src/interfaces/activekidrolloutbucket/)[]

Defined in: [packages/core/src/crypto/rollout-policy.ts:13](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/rollout-policy.ts#L13)

Rollout targets in priority order.
Example: [{ kid: "k-2026-02", percentage: 25 }]

***

### defaultKid?

> `optional` **defaultKid**: `string`

Defined in: [packages/core/src/crypto/rollout-policy.ts:25](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/rollout-policy.ts#L25)

Fallback kid when no bucket matches.

***

### seed?

> `optional` **seed**: `string`

Defined in: [packages/core/src/crypto/rollout-policy.ts:17](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/rollout-policy.ts#L17)

Deterministic hash seed.

***

### stickyFields?

> `optional` **stickyFields**: readonly keyof [`FieldCryptoKeyContext`](/api/core/src/interfaces/fieldcryptokeycontext/)[]

Defined in: [packages/core/src/crypto/rollout-policy.ts:21](https://github.com/k-otp/k-msg/blob/main/packages/core/src/crypto/rollout-policy.ts#L21)

Context keys used to build sticky rollout identity.
