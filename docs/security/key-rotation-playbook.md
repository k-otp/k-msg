# Key Rotation Playbook

Question this page answers: How do we rotate encryption keys twice in a row without read/write downtime?

## One-line definition

Key rotation keeps new writes on an active key (`kid`) while reads remain compatible with old keys.

## Why this matters

Without multi-kid decrypt, historical rows fail to decrypt during rollout.

## Recommended sequence

1. Add new key (`B`) to decrypt key set while active key remains `A`.
2. Switch active encrypt key from `A` to `B`.
3. Verify reads for mixed `A/B` rows.
4. Repeat for `C` (`B->C`) with the same pattern.
5. Remove oldest key only after retention/backfill windows complete.

## Common mistakes

- Enabling new active key before decrypt set includes both old and new keys.
- Removing the old key immediately after rollout start.
- Skipping per-tenant rollout controls.

## Runbook checks

- `key_kid_usage` shows expected active `kid`.
- `crypto_fail_count` does not spike on decrypt.
- `crypto_circuit_state` remains `closed` for healthy scopes.
