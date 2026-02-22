---
title: "KR B2B Retention Policy"
description: "KR B2B baseline retention windows and tenant-contract override rules"
---
`k-msg` provides a KR B2B retention preset for messaging operations.

## Default retention windows (KR preset)

- Operational logs (`opsLogs`): `90 days`
- Telecom metadata (`telecomMetadata`): `365 days`
- Billing evidence (`billingEvidence`): `1825 days`

## Policy priority

1. Tenant contract terms (including early deletion)
2. Product preset policy
3. Legal baseline defaults

This means stricter tenant deletion requirements take precedence when configured.

## Schema and operations

- Standard columns: `retention_class`, `retention_bucket_ym`
- Postgres/MySQL: partition DDL templates
- SQLite/D1: bucket-index chunk delete with equivalent semantics

## Recommended implementation

- Keep OTP/message body short-lived (`1~7 days`) and purge
- Never log plaintext; emit masked values only
- Prefer bucket/partition cleanup over bulk row deletes

Reference:

- [docs/compliance/kr-b2b-retention.md](https://github.com/k-otp/k-msg/blob/main/docs/compliance/kr-b2b-retention.md)
