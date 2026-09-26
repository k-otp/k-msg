---
npm/@k-msg/messaging: patch
---

`JobProcessor`, `MessageRetryHandler`, `DeliveryTracker`, and `BulkMessageSender` now log failures in their background work through the `@k-msg/core` logger instead of leaving them as unhandled promise rejections, which end a Node.js process by default. A job queue that throws while being polled, an `onRetryFailed` or `onRetryExhausted` callback that rejects, or a throwing `webhook:failed` listener no longer crashes the process, and the polling and retry loops keep running.
