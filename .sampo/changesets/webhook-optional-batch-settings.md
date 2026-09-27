---
npm/@k-msg/webhook: minor
---

`WebhookConfig.batchSize` and `batchTimeoutMs` are optional, defaulting to 10 events and 5000 ms, so a config used only with `emitSync()` can leave them out. A `batchSize` below 1 or not a number now also falls back to 10; before, it made `flush()` and `shutdown()` loop forever without sending anything. `Infinity` still leaves every event for `flush()` or the timer.
