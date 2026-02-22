---
npm/k-msg: patch
npm/@k-msg/core: patch
npm/@k-msg/messaging: patch
npm/@k-msg/provider: patch
---

Patch CI failures introduced after `0.22.0` by aligning lint/docs-generated artifacts with repository checks.

- Remove explicit `any` usage in core error utilities.
- Apply Biome formatting/import cleanup for changed source files.
- Regenerate CLI help/docs artifacts required by `docs:check`.
