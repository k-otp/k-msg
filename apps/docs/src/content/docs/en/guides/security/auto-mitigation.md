---
title: "Auto Mitigation (Control Signal)"
description: "How to promote crypto metrics into control signals and isolate failures by scope"
---
Question this page answers: How can I isolate key-error bursts to a single scope instead of impacting all traffic?

## Core concept

- One-line definition: `CryptoCircuitController` changes circuit state per scope from crypto failure metrics.
- Why it matters: one tenant/provider/key incident should not degrade unrelated traffic.
- Configuration example (`safe`): scope=`tenant+provider+kid`, auto-open only for key/AAD/kid mismatch classes.
- Common mistake: treating all generic network errors as circuit-open triggers.

## State machine

1. `closed`: normal path
2. `open`: isolate scope after threshold breach
3. `half-open`: probe after cooldown
4. `closed`: recover after successful operation

## Operational events

- Structured event fields: state, scope, reason, errorClass
- Metrics: `crypto_circuit_state`, `crypto_circuit_open_count`
- Runbook callback: trigger operator workflow on open transition

## Risk labels

- `safe`: auto-open only key-related classes
- `caution`: too-low threshold causes noisy isolation
- `unsafe`: global isolation with no scope key

## Next

- [Security Recipes](./recipes)
- [Crypto Control Signals (root docs)](https://github.com/k-otp/k-msg/blob/main/docs/security/crypto-control-signals.md)
