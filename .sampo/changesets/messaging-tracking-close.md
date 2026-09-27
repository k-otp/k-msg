---
npm/@k-msg/messaging: patch
---

`DeliveryTrackingService.close()` no longer closes the store under a poll in progress, including one still setting up the store. It stops the poll as if its signal had aborted, waits for it to store the statuses it has, and then closes the store, after which the service does not poll again. It does not wait for status changes still being delivered to `onStatusChange`, and a fallback send in progress is cancelled only if the sender passes on its context's signal. A poll run by `start()` that fails is logged once through the `@k-msg/core` logger instead of being dropped, and a tick that comes while a poll is still running is skipped rather than joining it.
