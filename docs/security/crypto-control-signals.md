# Crypto Control Signals

Question this page answers: How do we convert crypto failure metrics into automated mitigation actions safely?

## One-line definition

Control signals are circuit-state transitions derived from crypto failures by scope.

## Why this matters

Automatic scope isolation limits blast radius when key/AAD/kid failures surge.

## Scope model

- Default scope key: `tenant + provider + kid`
- Isolation must be local to the failing scope
- Unrelated scopes remain `closed`

## State transitions

1. `closed` -> `open`: threshold exceeded for key-related errors
2. `open` -> `half-open`: cooldown elapsed
3. `half-open` -> `closed`: successful operation observed
4. `half-open` -> `open`: failure recurs during probe

## Required signals

- Metrics:
  - `crypto_fail_count`
  - `crypto_circuit_open_count`
  - `crypto_circuit_state`
- Event fields:
  - `scope`
  - `reason`
  - `errorClass`
  - `operation`

## Common mistakes

- Opening circuits for generic network failures.
- Using global scope instead of scoped keys.
- Missing runbook trigger on `open` transitions.
