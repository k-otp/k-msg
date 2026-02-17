---
npm/k-msg: patch
---

Align `k-msg` packaging metadata with the current workspace release line by refreshing the lockfile, so packed dependencies resolve to the current `@k-msg/*` versions instead of stale `0.16.0`.

Also updates facade docs/tests to match the current root export contract (`KMsgErrorCode` and `fail` checks included).
