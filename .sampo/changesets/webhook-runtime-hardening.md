---
npm/@k-msg/webhook: patch
---

Fix `flush()`/`shutdown()` spinning while a batch is in flight, stop re-delivering already dispatched events after a failed batch, reject private IPv6/IPv4 endpoint hosts that URL canonicalization previously let through, stop following redirects during delivery, and apply a per-endpoint `maxRetries` (including 0) to every failure type instead of capping network errors at the global value.
