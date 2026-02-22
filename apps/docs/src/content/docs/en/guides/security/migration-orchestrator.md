---
title: "Migration Orchestrator"
description: "How to migrate legacy -> secure with plan/apply/status/retry and recover safely"
---
Question this page answers: How do I resume large backfills after interruption without breaking data consistency?

## Core concept

- One-line definition: the orchestrator is an execution layer tracking backfill lifecycle with `plan/apply/status/retry`.
- Why it matters: failed chunks are retried precisely without duplicate writes.
- Configuration example (`safe`): persist progress in DB meta tables and local snapshots.
- Common mistake: relying only on logs with no resumable state.

## CLI flow

```bash
k-msg db tracking migrate plan --sqlite-file ./local.db
k-msg db tracking migrate apply --sqlite-file ./local.db
k-msg db tracking migrate status --sqlite-file ./local.db
k-msg db tracking migrate retry --sqlite-file ./local.db
```

## Operational checkpoints

1. Keep the same `planId` for resumed execution.
2. Retry only failed chunks with `retry`.
3. Switch `compatPlainColumns=false` only after hash/cipher consistency checks.

## Risk labels

- `safe`: validate status before each stage transition
- `caution`: force-stop during apply without reading status
- `unsafe`: create a new plan while old plan is still active

## Next

- [Auto Mitigation](./auto-mitigation)
- [Migration CLI Runbook (root docs)](https://github.com/k-otp/k-msg/blob/main/docs/security/migration-cli-runbook.md)
