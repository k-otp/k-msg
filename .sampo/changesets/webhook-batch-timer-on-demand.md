---
npm/@k-msg/webhook: patch
---

`WebhookRuntimeService` no longer starts a timer when it is created. With `autoStart` (the default) it started a `setInterval` in the constructor even if `emit()` was never called: a Worker that built a runtime per request leaked one interval per request, and a Node.js process with a runtime never exited until `shutdown()`. The batch timer now starts when `emit()` queues an event and stops once the queue is empty, `flush()` cancels it, and `emit()` after `shutdown()` starts none. Events still go out within `batchTimeoutMs` of being queued. The README explains how to use `emit()` on Cloudflare Workers: `autoStart: false` and `ctx.waitUntil(runtime.flush())`, or `emitSync()`.
