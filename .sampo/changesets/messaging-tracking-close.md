---
npm/@k-msg/messaging: patch
---

`DeliveryTrackingService.close()` no longer closes the store under a poll in progress. It stops the poll as if its signal had aborted, waits for it to store the statuses it has, and then closes the store, after which the service does not poll again. A poll run by `start()` that fails is logged through the `@k-msg/core` logger instead of being dropped.
