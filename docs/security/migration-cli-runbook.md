# Migration CLI Runbook

Question this page answers: How do operators execute and recover legacy -> secure migration using CLI?

## One-line definition

Migration orchestrator commands (`plan/apply/status/retry`) provide resumable field-crypto backfill.

## Why this matters

Large migrations can fail mid-run; resumable state prevents data drift and duplicate updates.

## Commands

```bash
k-msg db tracking migrate plan --sqlite-file ./local.db
k-msg db tracking migrate apply --sqlite-file ./local.db
k-msg db tracking migrate status --sqlite-file ./local.db
k-msg db tracking migrate retry --sqlite-file ./local.db
```

## Operational sequence

1. Generate a plan and record `planId`.
2. Apply chunks with controlled `--max-chunks`.
3. Check status before each stage transition.
4. Retry only failed chunks.
5. Switch to secure-only read path after parity checks.

## Common mistakes

- Creating a new plan while an existing plan is incomplete.
- Running retry without checking failure scope.
- Disabling plain compatibility before hash/cipher parity checks.
