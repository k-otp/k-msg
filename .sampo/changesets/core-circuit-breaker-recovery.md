---
npm/@k-msg/core: patch
---

Fix `CircuitBreaker` recovery: a success now resets the failure count, so only consecutive failures open the circuit instead of every failure since the last recovery. Half-open admits a single trial call and fails the rest fast until it settles, `onOpen` fires once per opening even when in-flight calls fail late, and each call clears its timeout timer instead of leaving it pending for `timeout` milliseconds.
