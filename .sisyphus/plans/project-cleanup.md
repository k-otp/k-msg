# Project Cleanup & Organization Plan

## TL;DR
> **Goal**: Remove redundant test files, obsolete plans, and misplaced artifacts to maintain a clean project structure.
> **Focus**: Root directory cleanup, `packages/provider` test consolidation, and `.sisyphus` maintenance.

---

## 1. Root Directory Cleanup
> **Objective**: Move or remove standalone test files in the root.

- [x] **1.1. Handle Misplaced Tests**:
  - Analyze `integration.test.ts` and `integration-unit.test.ts` in the root.
  - If redundant with `tests/integration/template-flow.test.ts`, **delete** them.
  - If they contain unique value, move them to `tests/integration/`.

## 2. Package-Specific Cleanup
> **Objective**: Remove redundant or temporary test/example files.

- [x] **2.1. `packages/provider` Consolidation**:
  - **Delete** `packages/provider/src/simple-tests.test.ts`.
  - **Delete** `packages/provider/src/mock.test.ts`.
  - **Delete** `packages/provider/src/performance.test.ts`.
  - **Delete** `packages/provider/src/type-safety.test.ts`.
  - **Delete** `packages/provider/src/enhanced-tests.test.ts`.
  - *Rationale*: These appear to be development-time checks that are now covered by `aligo.adapter.test.ts` and the main integration suite.

- [x] **2.2. `packages/core` Artifacts**:
  - Ensure no `.d.ts` or `.js.map` files remain in `src/` directories (though previous cleanup should have handled this).

## 3. Maintenance Cleanup (`.sisyphus`)
> **Objective**: Archive or remove completed planning artifacts.

- [x] **3.1. Clean Drafts**:
  - **Delete** `.sisyphus/drafts/analysis.md`.

- [x] **3.2. Archive Plans** (Optional/Recommendation):
  - Move completed `.md` files from `.sisyphus/plans/` to an `archive/` folder or simply delete them if no longer needed for audit. Let's **delete** them to keep it lean as per user request.

---

## Success Criteria
1. No `.test.ts` files exist in the root directory.
2. `packages/provider` only contains essential tests.
3. `.sisyphus` directory is free of stale drafts.
