---
npm/@k-msg/messaging: minor
---

`DeliveryTrackingService.runOnce()` takes `{ signal, fetch }`, like `KMsg.send()`, and passes it to each provider status query, which it used to call without a request context. The signal also bounds the poll: once it aborts, no more queries start, those still running are cancelled, and `runOnce()` stores the statuses it has and returns, leaving the other records due. A cancelled query no longer counts as an attempt or marks the record `UNKNOWN`, and a call that joins a poll in progress returns when its own signal aborts.

Polls also lease the records they take through the new optional `DeliveryTrackingStore.leaseDue()`, which the SQL stores and `InMemoryDeliveryTrackingStore` implement: another service polling the same store, such as an overlapping cron run, skips them until the poll stores their next check, so a message is not queried or sent a fallback twice at once. `polling.leaseMs` (5 minutes by default) is how long a lease lasts if the poll does not hand it back; `0` turns leasing off.
