# Deep Cleanup & Project Stabilization Plan

## TL;DR
> **Goal**: Remove all confirmed legacy code, outdated documentation, and redundant tests to establish a clean v1.0.0 baseline.
> **Focus**: `packages/messaging`, `packages/provider`, `examples`, and `docs`.

---

## 1. Eliminate Legacy Messaging Services (Confirmed Deletion)
> **Objective**: Remove the deprecated service layer that has been replaced by `KMsg` pipeline.

- [x] **1.1. Delete Messaging Services**:
  - Remove `packages/messaging/src/services/message.service.ts`.
  - Remove `packages/messaging/src/services/iwinv-message.service.ts`.
  - Remove `packages/messaging/src/services/base-message.service.ts`.
  - Remove `packages/messaging/src/services/message-service.factory.ts`.
  - *Rationale*: These are fully deprecated and confusing to new contributors.

## 2. Clean Up Provider Tests (Retry)
> **Objective**: Ensure the tests that "survived" the previous cleanup are actually deleted.

- [x] **2.1. Verify & Delete**:
  - Check existence and force delete `packages/provider/src/simple-tests.test.ts`.
  - Check existence and force delete `packages/provider/src/mock.test.ts`.
  - Check existence and force delete `packages/provider/src/performance.test.ts`.
  - Check existence and force delete `packages/provider/src/type-safety.test.ts`.
  - Check existence and force delete `packages/provider/src/enhanced-tests.test.ts`.

## 3. Remove Outdated Documentation & Examples
> **Objective**: Prevent user confusion by removing documentation that references the old architecture.

- [x] **3.1. Delete Obsolete Docs**:
  - Remove `docs/USAGE_GUIDE.md` (superseded by README).
  - Remove `docs/PROVIDER_MIGRATION_PLAN.md` (completed).
  - Remove `docs/ARCHITECTURE_COMPARISON.md` (historical only).

- [x] **3.2. Delete Legacy Examples**:
  - Remove `examples/simple-usage.ts` (uses deprecated `createKMsgSender`).
  - Remove `examples/usage-examples.md`.
  - Remove `apps/message-service/examples/usage.ts`.

## 4. Final Polish
> **Objective**: Ensure the remaining codebase is consistent.

- [ ] **4.1. Fix Exports**:
  - Check `packages/k-msg/src/index.ts` and remove exports of the deleted legacy services.
  - Check `packages/messaging/src/index.ts` and remove exports of deleted services.

- [ ] **4.2. Verify Build**:
  - Run `bun run build:all` to ensure no dangling references remain.

---

## Success Criteria
1. `packages/messaging/src/services` directory is gone.
2. `examples/` directory is clean or removed.
3. Build succeeds without errors.
