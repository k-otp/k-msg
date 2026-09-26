---
npm/@k-msg/webhook: minor
---

Remove `BatchDispatcher` and its `BatchConfig` type from `@k-msg/webhook/toolkit`. It never sent an HTTP request: each job got a simulated result, a random 200 (about nine jobs in ten) or 500 with an invented latency, and `batchExecuted` counted every job as successful, so consumers saw deliveries that never happened. To batch deliveries, queue events with `WebhookRuntimeService.emit()`: the runtime sends them through `WebhookDispatcher` `batchSize` at a time, `flush()` or `shutdown()` sends what is still queued, and `listDeliveries()` returns each result. To deliver to an endpoint you manage yourself, call `WebhookDispatcher.dispatch(event, endpoint)` after checking its URL with `validateEndpointUrl()`.
