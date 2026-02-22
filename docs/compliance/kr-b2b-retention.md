# KR B2B Retention Baseline

## Default preset (`kr-b2b-baseline`)

- `opsLogs`: 90 days
- `telecomMetadata`: 365 days
- `billingEvidence`: 1825 days

## Contract precedence

Tenant contract override takes precedence over preset defaults.  
Use `contractOverrideResolver` to enforce earlier purge periods.

## Tracking schema fields

- `retention_class`
- `retention_bucket_ym`

These fields support partition/bucket-based cleanup strategies.

## Operational guidance

- Keep message body/OTP short-lived (recommended 1~7 days).
- Persist telecom evidence without plaintext phone data.
- Persist billing evidence as masked/aggregated data when possible.
- Periodically delete by retention bucket to reduce heavy full-table deletes.
