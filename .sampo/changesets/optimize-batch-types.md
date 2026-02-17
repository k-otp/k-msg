---
npm/@k-msg/messaging: patch
---

Optimization: refactor `KMsg.send(batch)` to use smart batching (provider-specific chunk limits) and remove unsafe type casts in interpolation logic.
