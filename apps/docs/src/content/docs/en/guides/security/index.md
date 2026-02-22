---
title: "Security Policy"
description: "k-msg field crypto(v1) security and compliance baseline"
---
`k-msg` provides a shared `fieldCrypto` policy layer for security-audit readiness.

This section covers encryption-at-write, hash-based lookup, key rotation, failure modes, and retention rules from an operator-focused perspective.

## Documents

- [Field Crypto v1](./field-crypto-v1): crypto model, AAD, failure handling, and metrics
- [KR B2B Retention](./kr-b2b-retention): baseline legal retention and tenant-contract priority

## Core principles

- Default is `secure`; plaintext storage is denied by default.
- `failMode` defaults to `closed`.
- Lookups use `HMAC-SHA256` hashes, not deterministic encryption.
- Tenant early-deletion terms override legal baseline defaults.

Source of truth:

- [docs/security/field-crypto-v1.md](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-v1.md)
- [docs/security/field-crypto-runbook.md](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-runbook.md)
- [docs/compliance/kr-b2b-retention.md](https://github.com/k-otp/k-msg/blob/main/docs/compliance/kr-b2b-retention.md)
