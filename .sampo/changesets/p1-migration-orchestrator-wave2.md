---
npm/@k-msg/messaging: minor
---

Add tracking SQL field-crypto migration orchestrator primitives:

- add migration planning/execution/status/retry modules
- add migration state tables and query helpers
- add migration metadata schema SQL builder
- add CLI command group: `k-msg db tracking migrate plan|apply|status|retry` (sqlite-first)

