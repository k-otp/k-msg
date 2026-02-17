---
npm/k-msg: patch
---

Expose selected core utilities from `k-msg` root (`KMsgError`, `KMsgErrorCode`, `ok`, `fail`, and key send-related types) to reduce onboarding friction while keeping provider and tracking APIs out of the root facade.

Also updates root export boundary tests to match the new facade contract.
