# Field Crypto Runbook

## Alarm: `crypto_fail_count` spike

1. Check recent deploy/config changes (`kid`, provider key, AAD fields).
2. Identify operation type (`encrypt` vs `decrypt`).
3. If `failMode=closed`, route traffic to fallback provider path and fix keys first.
4. If `failMode=open`, verify no plaintext fallback policy violation.

## Alarm: `kid` mismatch / decrypt failures

1. Confirm `resolveDecryptKeys` includes old and new keys.
2. Confirm ciphertext envelope `kid` is expected.
3. Validate AAD consistency (`messageId/providerId/tableName/fieldPath`).

## Backfill stalled

1. Pause write cutover (`compatPlainColumns=true`).
2. Resume backfill by bucket.
3. Re-validate hash indexes (`to_hash`, `from_hash`).
4. Re-enable secure-only path after parity checks.

## Incident logging policy

- Do not log plaintext phone numbers or payload secrets.
- Log masked values and `kid`, `error class`, `request id`.
