---
npm/@k-msg/messaging: patch
---

`DeliveryTrackingService.runOnce()` no longer stops at the first update the store rejects. The rest of the batch is still stored and still gets API failover. A record whose update the store rejects is checked again after its next backoff delay, so a record the store keeps rejecting cannot take a batch slot on every poll. `runOnce()` then rejects with an `AggregateError` that lists the failures and names the first one.
