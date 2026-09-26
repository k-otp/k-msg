---
npm/@k-msg/analytics: patch
---

`MetricAggregator` now logs a failed periodic flush through the `@k-msg/core` logger instead of leaving an unhandled promise rejection, which ends a Node.js process by default. The buffered metrics are kept, so the next interval retries them as before.
