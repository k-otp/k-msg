---
npm/@k-msg/messaging: patch
---

`DeliveryTrackingService.runOnce()` no longer stops at the first update the store rejects. A record whose update fails stays due for the next poll, the rest of the batch is still stored and still gets API failover, and `runOnce()` then rejects with an `AggregateError` that lists the failures and names the first one.
