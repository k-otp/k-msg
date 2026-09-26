---
npm/@k-msg/messaging: patch
---

Durable Object-backed tracking stores and job queues now see every key. Their storage listing made one call capped at 1000 keys, so records and jobs past the first 1000 were never listed; it now pages through with `startAfter`, as the KV and R2 listings already did.
