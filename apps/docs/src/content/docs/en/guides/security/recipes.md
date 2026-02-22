---
title: "Security Recipes"
description: "Practical fieldCrypto setup patterns for non-security specialists"
---
Question this page answers: Which configuration combinations are safe defaults I can apply right now?

## Recipe 1: safest default (`safe`)

```ts
const fieldCrypto = {
  enabled: true,
  failMode: "closed",
  fields: {
    to: "encrypt+hash",
    from: "encrypt+hash",
  },
  provider,
};
```

- Use when: new rollout or any service storing recipient identifiers
- Result: plaintext blocked, hash-index lookup enabled

## Recipe 2: staged migration (`caution`)

```ts
fieldCryptoSchema: {
  enabled: true,
  mode: "secure",
  compatPlainColumns: true,
}
```

- Use when: migrating from legacy plaintext columns
- Rollout order: add columns -> backfill -> verify reads -> set `compatPlainColumns=false`
- Caution: keep the compatibility window short

## Recipe 3: temporary fail-open (`caution`)

```ts
const fieldCrypto = {
  failMode: "open",
  openFallback: "masked",
};
```

- Use when: short-lived incident where availability is prioritized
- Required guard: alert on `crypto_fail_count`, then return to `closed`

## Recipe 4: never default to plaintext fallback (`unsafe`)

```ts
const fieldCrypto = {
  failMode: "open",
  openFallback: "plaintext",
  // unsafeAllowPlaintextStorage missing
};
```

- Result: initialization fails by design
- Reason: plaintext fallback is blocked without explicit unsafe opt-in

## 3-step operational checklist

1. Ensure lookup fields (`to`, `from`) use `encrypt+hash`
2. Ensure `failMode` is `closed` unless incident response requires otherwise
3. Ensure dashboards include `crypto_fail_count` and `key_kid_usage`

## Next

- [Security Glossary](./glossary)
- [KR B2B Retention Policy](./kr-b2b-retention)
