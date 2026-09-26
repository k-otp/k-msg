---
npm/@k-msg/webhook: patch
---

`LoadBalancer` and `QueueManager` now log failures in their timer-driven work through the `@k-msg/core` logger instead of leaving unhandled promise rejections, which end a Node.js process by default. A throwing `healthCheckFailed` listener during a periodic health check, or a throwing `jobEnqueued` listener when a delayed job comes due, no longer crashes the process.
