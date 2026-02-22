---
title: "Key Management and Rotation"
description: "How to run zero-downtime key rotation with KeyResolver and KMS/Vault/ENV adapters"
---
Question this page answers: How do I rotate keys without downtime while keeping read/write compatibility?

## Core concept

- One-line definition: `KeyResolver` decouples key lifecycle decisions from application business logic.
- Why it matters: key generation/activation/retirement can evolve without rewriting send/tracking flows.
- Configuration example (`safe`): active `kid` for encrypt, old/new/new2 for decrypt.
- Common mistake: removing previous decrypt `kid` too early after rollout.

## Rollout recipe

1. Choose adapter source: `ENV`, `AWS KMS`, or `Vault Transit`.
2. Apply percentage rollout with `createRollingKeyResolver` (10% -> 50% -> 100%).
3. Keep multi-kid decrypt enabled to support two consecutive rotations (A->B->C).

## Risk labels

- `safe`: active encrypt key + multi-kid decrypt
- `caution`: instant 100% rollout without monitoring
- `unsafe`: decrypt set excludes previous key ids

## Next

- [Auto Mitigation](./auto-mitigation)
- [Key Rotation Playbook (root docs)](https://github.com/k-otp/k-msg/blob/main/docs/security/key-rotation-playbook.md)
